const Coupon = require('../models/Coupon');
const { AppError, asyncHandler } = require('../utils/errors');
const {
  syncExpiredCoupons,
  findAndValidateCoupon,
  redeemVerifiedCoupon,
} = require('../services/couponService');

const getCouponById = asyncHandler(async (req, res) => {
  const couponId = req.params.couponId.trim().toUpperCase();
  await syncExpiredCoupons({ couponId });

  const coupon = await Coupon.findOne({ couponId })
    .populate('student', 'name studentId email department semester isActive')
    .populate('redeemedBy', 'name email');

  if (!coupon) {
    throw new AppError('Coupon not found.', 404, 'COUPON_NOT_FOUND');
  }

  if (req.user.role !== 'admin' && coupon.student._id.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to view this coupon.', 403, 'FORBIDDEN');
  }

  res.status(200).json({
    success: true,
    data: { coupon },
  });
});

const verifyCoupon = asyncHandler(async (req, res) => {
  const { qrData, couponId, verificationToken } = req.body;

  const result = await findAndValidateCoupon({
    rawQr: qrData,
    couponId,
    verificationToken,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

const redeemCoupon = asyncHandler(async (req, res) => {
  const { qrData, couponId, verificationToken } = req.body;

  const coupon = await redeemVerifiedCoupon({
    rawQr: qrData,
    couponId,
    verificationToken,
    adminUser: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Coupon redeemed successfully.',
    data: { coupon },
  });
});

module.exports = {
  getCouponById,
  verifyCoupon,
  redeemCoupon,
};
