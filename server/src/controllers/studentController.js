const Coupon = require('../models/Coupon');
const Menu = require('../models/Menu');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');
const { getTodayDateString } = require('../utils/dateUtils');
const { syncExpiredCoupons, generateDailyLunchCoupon } = require('../services/couponService');
const { createNotification } = require('../services/notificationService');

const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const today = getTodayDateString();

  await syncExpiredCoupons({ student: studentId });

  const [
    totalCoupons,
    redeemedCoupons,
    activeCoupons,
    todayCoupon,
    recentCoupons,
    todayLunchMenu,
  ] = await Promise.all([
    Coupon.countDocuments({ student: studentId }),
    Coupon.countDocuments({ student: studentId, status: 'REDEEMED' }),
    Coupon.countDocuments({ student: studentId, status: 'ACTIVE' }),
    Coupon.findOne({ student: studentId, couponDate: today, mealType: 'Lunch' })
      .populate('student', 'name studentId email department semester')
      .lean(),
    Coupon.find({ student: studentId })
      .sort({ generatedAt: -1 })
      .limit(5)
      .lean(),
    Menu.findOne({ date: today, mealType: 'Lunch' }).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      today,
      stats: {
        totalCoupons,
        redeemedCoupons,
        activeCoupons,
        currentMeal: 'Lunch',
      },
      todayCoupon,
      recentCoupons,
      todayLunchMenu,
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, department, semester } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== req.user.email) {
    const duplicate = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user._id },
    });
    if (duplicate) {
      throw new AppError('Another account already uses this email address.', 409, 'EMAIL_EXISTS');
    }
  }

  req.user.name = name.trim();
  req.user.email = normalizedEmail;
  req.user.department = department.trim();
  req.user.semester = Number(semester);
  await req.user.save();

  await createNotification({
    userId: req.user._id,
    title: 'Profile Updated',
    message: 'Your account profile information has been updated.',
    type: 'account',
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: req.user.toJSON(),
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userWithHash = await User.findById(req.user._id).select('+passwordHash');

  const isMatch = await userWithHash.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }

  userWithHash.passwordHash = await User.hashPassword(newPassword);
  await userWithHash.save();

  await createNotification({
    userId: req.user._id,
    title: 'Password Changed',
    message: 'Your MessMate password was changed successfully.',
    type: 'account',
  });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully.',
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  await syncExpiredCoupons({ student: studentId });

  const { status, search, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const filter = { student: studentId };
  if (status && ['ACTIVE', 'REDEEMED', 'EXPIRED'].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }
  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.couponId = { $regex: escaped, $options: 'i' };
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ generatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('redeemedBy', 'name')
      .lean(),
    Coupon.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      coupons,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(Math.ceil(total / limitNum), 1),
      },
    },
  });
});

const getTodayCoupon = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const today = getTodayDateString();
  await syncExpiredCoupons({ student: studentId });

  const coupon = await Coupon.findOne({
    student: studentId,
    couponDate: today,
    mealType: 'Lunch',
  })
    .populate('student', 'name studentId email department semester')
    .populate('redeemedBy', 'name')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      today,
      coupon,
    },
  });
});

const generateTodayCoupon = asyncHandler(async (req, res) => {
  const coupon = await generateDailyLunchCoupon(req.user);

  res.status(201).json({
    success: true,
    message: 'Lunch coupon generated successfully.',
    data: { coupon },
  });
});

const getMenu = asyncHandler(async (req, res) => {
  const date =
    req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : getTodayDateString();

  const menus = await Menu.find({ date }).lean();

  const mealOrder = { Breakfast: 1, Lunch: 2, Snacks: 3, Dinner: 4 };
  menus.sort((a, b) => (mealOrder[a.mealType] || 9) - (mealOrder[b.mealType] || 9));

  res.status(200).json({
    success: true,
    data: {
      date,
      menus,
    },
  });
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  changePassword,
  getCoupons,
  getTodayCoupon,
  generateTodayCoupon,
  getMenu,
};
