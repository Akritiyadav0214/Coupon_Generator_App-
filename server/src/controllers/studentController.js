const Coupon = require('../models/Coupon');
const Menu = require('../models/Menu');
const WeeklyMenu = require('../models/WeeklyMenu');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/errors');
const { getTodayDateString, getWeekdayFromDateString } = require('../utils/dateUtils');
const { syncExpiredCoupons, generateDailyLunchCoupon } = require('../services/couponService');
const { createNotification } = require('../services/notificationService');

const HOSTEL_MENU_META = {
  hostelName: "ABES Boys' Hostel",
  caterer: 'Naina Caters (ABESEC & ABESBS, Ghaziabad)',
  notes: [
    'Salad (radish, carrot, beetroot, onion) includes a minimum of three vegetables.',
    'Tea brewed with tulsi, elaichi & adrakh.',
    'All vegetables cooked in mustard oil.',
    'Seasonal fruits: Banana / papaya / apple / guava.',
  ],
};

const MEAL_ORDER = { Breakfast: 1, Lunch: 2, Snacks: 3, Dinner: 4 };

const getDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const today =
    req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : getTodayDateString();
  const dayOfWeek = getWeekdayFromDateString(today);

  await syncExpiredCoupons({ student: studentId });

  const [
    totalCoupons,
    redeemedCoupons,
    activeCoupons,
    todayCoupon,
    recentCoupons,
    weeklyLunchMenu,
    dateLunchMenu,
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
    WeeklyMenu.findOne({ dayOfWeek, mealType: 'Lunch', isPublished: true }).lean(),
    Menu.findOne({ date: today, mealType: 'Lunch' }).lean(),
  ]);

  const todayLunchMenu = weeklyLunchMenu || dateLunchMenu || null;

  res.status(200).json({
    success: true,
    data: {
      today,
      dayOfWeek,
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
  const dayOfWeek = getWeekdayFromDateString(date);

  const weeklySlots = await WeeklyMenu.find({ dayOfWeek }).lean();

  let menus;
  let source = 'weekly';

  if (weeklySlots.length > 0) {
    weeklySlots.sort((a, b) => (MEAL_ORDER[a.mealType] || 9) - (MEAL_ORDER[b.mealType] || 9));
    menus = weeklySlots.map((slot) => ({
      _id: slot._id,
      dayOfWeek: slot.dayOfWeek,
      date,
      mealType: slot.mealType,
      mealName: slot.mealName || slot.mealType,
      startTime: slot.startTime,
      endTime: slot.endTime,
      description: slot.isPublished
        ? slot.description
        : slot.description || 'This meal is currently unpublished or off for today.',
      isPublished: slot.isPublished,
      items: slot.isPublished ? slot.items : [],
    }));
  } else {
    source = 'date';
    const dateMenus = await Menu.find({ date }).lean();
    dateMenus.sort((a, b) => (MEAL_ORDER[a.mealType] || 9) - (MEAL_ORDER[b.mealType] || 9));
    menus = dateMenus.map((m) => ({
      ...m,
      dayOfWeek,
      mealName: m.mealType,
      isPublished: true,
    }));
  }

  res.status(200).json({
    success: true,
    data: {
      date,
      dayOfWeek,
      source,
      hostelInfo: HOSTEL_MENU_META,
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
