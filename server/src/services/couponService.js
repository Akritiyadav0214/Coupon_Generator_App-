const Coupon = require('../models/Coupon');
const { AppError } = require('../utils/errors');
const {
  getTodayDateString,
  getEndOfDayDate,
  getCompactDateString,
} = require('../utils/dateUtils');
const {
  generateCouponId,
  generateVerificationToken,
  timingSafeMatch,
  parseQrPayload,
} = require('../utils/couponCrypto');
const { createNotification } = require('./notificationService');

async function syncExpiredCoupons(extraFilter = {}) {
  const now = new Date();
  await Coupon.updateMany(
    {
      ...extraFilter,
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    },
    { $set: { status: 'EXPIRED' } }
  );
}

async function generateDailyLunchCoupon(student) {
  const today = getTodayDateString();
  await syncExpiredCoupons({ student: student._id });

  const existing = await Coupon.findOne({
    student: student._id,
    couponDate: today,
    mealType: 'Lunch',
  }).populate('student', 'name studentId email department semester');

  if (existing) {
    throw new AppError(
      'You have already generated your lunch coupon for today.',
      409,
      'COUPON_ALREADY_EXISTS',
      { coupon: existing }
    );
  }

  const compactDate = getCompactDateString(today);
  const expiresAt = getEndOfDayDate(today);

  let createdCoupon = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const couponId = generateCouponId(compactDate);
    const verificationToken = generateVerificationToken(
      couponId,
      student.studentId || student._id.toString(),
      today
    );

    try {
      createdCoupon = await Coupon.create({
        couponId,
        student: student._id,
        mealType: 'Lunch',
        couponDate: today,
        generatedAt: new Date(),
        expiresAt,
        status: 'ACTIVE',
        verificationToken,
      });
      break;
    } catch (err) {
      // Retry only if couponId collided; let duplicate daily coupon error bubble up
      if (err.code === 11000 && err.keyPattern?.couponId) {
        continue;
      }
      throw err;
    }
  }

  if (!createdCoupon) {
    throw new AppError('Unable to allocate unique coupon ID. Please try again.', 500);
  }

  await createNotification({
    userId: student._id,
    title: 'Lunch Coupon Generated',
    message: `Your lunch coupon ${createdCoupon.couponId} for ${today} is ready. Present the QR code at the mess counter.`,
    type: 'coupon',
  });

  return Coupon.findById(createdCoupon._id).populate(
    'student',
    'name studentId email department semester'
  );
}

async function findAndValidateCoupon({ rawQr, couponId, verificationToken }) {
  const parsed = rawQr ? parseQrPayload(rawQr) : { couponId, verificationToken };
  const targetCouponId = (parsed.couponId || couponId || '').trim().toUpperCase();
  const targetToken = (parsed.verificationToken || verificationToken || '').trim();

  if (!targetCouponId && !targetToken) {
    return {
      valid: false,
      verificationStatus: 'INVALID',
      message: 'Provide a valid coupon QR payload, coupon ID, or verification token.',
      coupon: null,
    };
  }

  const query = targetCouponId ? { couponId: targetCouponId } : { verificationToken: targetToken };

  const coupon = await Coupon.findOne(query)
    .populate('student', 'name studentId email department semester isActive')
    .populate('redeemedBy', 'name email');

  if (!coupon) {
    return {
      valid: false,
      verificationStatus: 'INVALID',
      message: 'No matching coupon was found in the system.',
      coupon: null,
    };
  }

  if (targetToken && !timingSafeMatch(coupon.verificationToken, targetToken)) {
    return {
      valid: false,
      verificationStatus: 'INVALID',
      message: 'Coupon verification token mismatch. Possible tampering detected.',
      coupon: null,
    };
  }

  const now = new Date();
  if (coupon.status === 'ACTIVE' && coupon.expiresAt < now) {
    coupon.status = 'EXPIRED';
    await coupon.save();
  }

  if (!coupon.student || !coupon.student.isActive) {
    return {
      valid: false,
      verificationStatus: 'INVALID',
      message: 'This student account is inactive or no longer exists.',
      coupon,
    };
  }

  if (coupon.status === 'REDEEMED') {
    return {
      valid: false,
      verificationStatus: 'ALREADY_REDEEMED',
      message: 'This coupon has already been redeemed and cannot be reused.',
      coupon,
    };
  }

  if (coupon.status === 'EXPIRED') {
    return {
      valid: false,
      verificationStatus: 'EXPIRED',
      message: 'This coupon has expired and is no longer valid.',
      coupon,
    };
  }

  return {
    valid: true,
    verificationStatus: 'VALID',
    message: 'Valid active coupon. Ready for mess redemption.',
    coupon,
  };
}

async function redeemVerifiedCoupon({ rawQr, couponId, verificationToken, adminUser }) {
  const check = await findAndValidateCoupon({ rawQr, couponId, verificationToken });

  if (!check.valid) {
    const statusMap = {
      ALREADY_REDEEMED: 409,
      EXPIRED: 400,
      INVALID: 404,
    };
    throw new AppError(
      check.message,
      statusMap[check.verificationStatus] || 400,
      check.verificationStatus,
      { coupon: check.coupon }
    );
  }

  const now = new Date();
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: check.coupon._id,
      status: 'ACTIVE',
      expiresAt: { $gt: now },
    },
    {
      $set: {
        status: 'REDEEMED',
        redeemedAt: now,
        redeemedBy: adminUser._id,
      },
    },
    { returnDocument: 'after' }
  )
    .populate('student', 'name studentId email department semester isActive')
    .populate('redeemedBy', 'name email');

  if (!updated) {
    throw new AppError(
      'Coupon could not be redeemed because it was already used or expired.',
      409,
      'ALREADY_REDEEMED'
    );
  }

  await createNotification({
    userId: updated.student._id,
    title: 'Coupon Redeemed',
    message: `Your lunch coupon ${updated.couponId} was verified and redeemed at the mess counter.`,
    type: 'redemption',
  });

  return updated;
}

module.exports = {
  syncExpiredCoupons,
  generateDailyLunchCoupon,
  findAndValidateCoupon,
  redeemVerifiedCoupon,
};
