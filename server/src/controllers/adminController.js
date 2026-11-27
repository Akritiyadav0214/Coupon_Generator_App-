const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Menu = require('../models/Menu');
const WeeklyMenu = require('../models/WeeklyMenu');
const { AppError, asyncHandler } = require('../utils/errors');
const { getTodayDateString, getLastNDates } = require('../utils/dateUtils');
const { syncExpiredCoupons } = require('../services/couponService');
const { createNotification, notifyActiveStudents } = require('../services/notificationService');

const escapeRegex = (val) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDashboard = asyncHandler(async (_req, res) => {
  const today = getTodayDateString();
  await syncExpiredCoupons();

  const last7Dates = getLastNDates(7);

  const [
    totalStudents,
    activeStudents,
    couponsGeneratedToday,
    couponsRedeemedToday,
    pendingCouponsToday,
    expiredCouponsTotal,
    totalCouponsAllTime,
    totalRedeemedAllTime,
    trendAgg,
    recentActivity,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    Coupon.countDocuments({ couponDate: today }),
    Coupon.countDocuments({ couponDate: today, status: 'REDEEMED' }),
    Coupon.countDocuments({ couponDate: today, status: 'ACTIVE' }),
    Coupon.countDocuments({ status: 'EXPIRED' }),
    Coupon.countDocuments(),
    Coupon.countDocuments({ status: 'REDEEMED' }),
    Coupon.aggregate([
      { $match: { couponDate: { $in: last7Dates } } },
      {
        $group: {
          _id: '$couponDate',
          generated: { $sum: 1 },
          redeemed: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'EXPIRED'] }, 1, 0] } },
        },
      },
    ]),
    Coupon.find()
      .sort({ updatedAt: -1 })
      .limit(8)
      .populate('student', 'name studentId department')
      .populate('redeemedBy', 'name')
      .lean(),
  ]);

  const trendMap = new Map(trendAgg.map((item) => [item._id, item]));
  const dailyTrend = last7Dates.map((dateStr) => {
    const entry = trendMap.get(dateStr) || { generated: 0, redeemed: 0, pending: 0, expired: 0 };
    return {
      date: dateStr,
      label: dateStr.slice(5),
      generated: entry.generated,
      redeemed: entry.redeemed,
      pending: entry.pending,
      expired: entry.expired,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      today,
      stats: {
        totalStudents,
        activeStudents,
        couponsGeneratedToday,
        couponsRedeemedToday,
        pendingCouponsToday,
        expiredCouponsTotal,
        totalCouponsAllTime,
        totalRedeemedAllTime,
      },
      dailyTrend,
      statusBreakdown: [
        { name: 'Redeemed', value: totalRedeemedAllTime },
        {
          name: 'Active',
          value: Math.max(totalCouponsAllTime - totalRedeemedAllTime - expiredCouponsTotal, 0),
        },
        { name: 'Expired', value: expiredCouponsTotal },
      ],
      recentActivity,
    },
  });
});

const getStudents = asyncHandler(async (req, res) => {
  const { search, department, semester, status, page = 1, limit = 10 } = req.query;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const filter = { role: 'student' };
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { studentId: rx }, { email: rx }];
  }
  if (department && department !== 'ALL') {
    filter.department = department;
  }
  if (semester && semester !== 'ALL' && !Number.isNaN(Number(semester))) {
    filter.semester = Number(semester);
  }
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const [students, total, departments] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
    User.distinct('department', { role: 'student' }),
  ]);

  const studentIds = students.map((s) => s._id);
  const couponCounts = await Coupon.aggregate([
    { $match: { student: { $in: studentIds } } },
    {
      $group: {
        _id: '$student',
        totalCoupons: { $sum: 1 },
        redeemedCoupons: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } },
      },
    },
  ]);

  const countMap = new Map(couponCounts.map((c) => [c._id.toString(), c]));
  const enriched = students.map((s) => {
    const counts = countMap.get(s._id.toString());
    return {
      ...s,
      totalCoupons: counts?.totalCoupons || 0,
      redeemedCoupons: counts?.redeemedCoupons || 0,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      students: enriched,
      departments: departments.filter(Boolean).sort(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(Math.ceil(total / limitNum), 1),
      },
    },
  });
});

const getStudentById = asyncHandler(async (req, res) => {
  await syncExpiredCoupons({ student: req.params.id });

  const student = await User.findOne({ _id: req.params.id, role: 'student' }).lean();
  if (!student) {
    throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
  }

  const coupons = await Coupon.find({ student: student._id })
    .sort({ generatedAt: -1 })
    .limit(50)
    .populate('redeemedBy', 'name')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      student,
      coupons,
    },
  });
});

const updateStudentStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive boolean field is required.', 400, 'VALIDATION_ERROR');
  }

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    throw new AppError('Student not found.', 404, 'STUDENT_NOT_FOUND');
  }

  student.isActive = isActive;
  await student.save();

  await createNotification({
    userId: student._id,
    title: isActive ? 'Account Reactivated' : 'Account Deactivated',
    message: isActive
      ? 'Your MessMate student account has been reactivated by the mess administrator.'
      : 'Your MessMate student account has been deactivated by the mess administrator.',
    type: 'account',
  });

  res.status(200).json({
    success: true,
    message: `Student account ${isActive ? 'activated' : 'deactivated'} successfully.`,
    data: { student: student.toJSON() },
  });
});

const getCoupons = asyncHandler(async (req, res) => {
  await syncExpiredCoupons();

  const { search, status, date, studentId, page = 1, limit = 12 } = req.query;
  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 12, 1), 50);

  const filter = {};
  if (status && ['ACTIVE', 'REDEEMED', 'EXPIRED'].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    filter.couponDate = date;
  }

  if (studentId && studentId.trim()) {
    const matchingStudents = await User.find({
      role: 'student',
      studentId: new RegExp(escapeRegex(studentId.trim()), 'i'),
    })
      .select('_id')
      .lean();
    filter.student = { $in: matchingStudents.map((s) => s._id) };
  }

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    const matchingUsers = await User.find({
      role: 'student',
      $or: [{ name: rx }, { studentId: rx }, { email: rx }],
    })
      .select('_id')
      .lean();

    const userIds = matchingUsers.map((u) => u._id);
    const searchOr = [{ couponId: rx }];
    if (userIds.length) {
      searchOr.push({ student: { $in: userIds } });
    }
    filter.$or = searchOr;
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ generatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('student', 'name studentId email department semester')
      .populate('redeemedBy', 'name email')
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

const getAnalytics = asyncHandler(async (req, res) => {
  await syncExpiredCoupons();
  const days = [7, 14, 30].includes(Number(req.query.days)) ? Number(req.query.days) : 14;
  const dates = getLastNDates(days);

  const [dailyAgg, departmentAgg, hourlyAgg, totalsAgg] = await Promise.all([
    Coupon.aggregate([
      { $match: { couponDate: { $in: dates } } },
      {
        $group: {
          _id: '$couponDate',
          generated: { $sum: 1 },
          redeemed: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'EXPIRED'] }, 1, 0] } },
        },
      },
    ]),
    Coupon.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: '$studentInfo.department',
          generated: { $sum: 1 },
          redeemed: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } },
        },
      },
      { $sort: { generated: -1 } },
      { $limit: 8 },
    ]),
    Coupon.aggregate([
      { $match: { status: 'REDEEMED', redeemedAt: { $ne: null } } },
      {
        $group: {
          _id: { $hour: { date: '$redeemedAt', timezone: '+05:30' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalGenerated: { $sum: 1 },
          totalRedeemed: { $sum: { $cond: [{ $eq: ['$status', 'REDEEMED'] }, 1, 0] } },
          totalActive: { $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] } },
          totalExpired: { $sum: { $cond: [{ $eq: ['$status', 'EXPIRED'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const dailyMap = new Map(dailyAgg.map((d) => [d._id, d]));
  const dailySeries = dates.map((d) => {
    const item = dailyMap.get(d) || { generated: 0, redeemed: 0, active: 0, expired: 0 };
    return {
      date: d,
      label: d.slice(5),
      generated: item.generated,
      redeemed: item.redeemed,
      active: item.active,
      expired: item.expired,
    };
  });

  const summary = totalsAgg[0] || {
    totalGenerated: 0,
    totalRedeemed: 0,
    totalActive: 0,
    totalExpired: 0,
  };

  const redemptionRate =
    summary.totalGenerated > 0
      ? Number(((summary.totalRedeemed / summary.totalGenerated) * 100).toFixed(1))
      : 0;

  res.status(200).json({
    success: true,
    data: {
      days,
      summary: {
        ...summary,
        redemptionRate,
      },
      dailySeries,
      departmentStats: departmentAgg.map((d) => ({
        department: d._id || 'General',
        generated: d.generated,
        redeemed: d.redeemed,
      })),
      hourlyDistribution: hourlyAgg.map((h) => ({
        hour: `${String(h._id).padStart(2, '0')}:00`,
        count: h.count,
      })),
    },
  });
});

const getMenus = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
    filter.date = req.query.date;
  }
  if (
    req.query.mealType &&
    ['Breakfast', 'Lunch', 'Snacks', 'Dinner'].includes(req.query.mealType)
  ) {
    filter.mealType = req.query.mealType;
  }

  const menus = await Menu.find(filter).sort({ date: 1 }).lean();
  const mealOrder = { Breakfast: 1, Lunch: 2, Snacks: 3, Dinner: 4 };
  menus.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (mealOrder[a.mealType] || 9) - (mealOrder[b.mealType] || 9);
  });

  res.status(200).json({
    success: true,
    data: { menus },
  });
});

const createMenu = asyncHandler(async (req, res) => {
  const { date, mealType, items, startTime, endTime, description } = req.body;

  const existing = await Menu.findOne({ date, mealType });
  if (existing) {
    throw new AppError(
      `A ${mealType} menu already exists for ${date}. Please edit the existing menu instead.`,
      409,
      'DUPLICATE_MENU',
      { existingMenuId: existing._id }
    );
  }

  const menu = await Menu.create({
    date,
    mealType,
    items,
    startTime,
    endTime,
    description: description || '',
    createdBy: req.user._id,
  });

  await notifyActiveStudents({
    title: `New ${mealType} Menu Published`,
    message: `${mealType} menu for ${date} (${startTime} - ${endTime}) is now available.`,
    type: 'menu',
  });

  return res.status(201).json({
    success: true,
    message: `${mealType} menu created successfully.`,
    data: { menu },
  });
});

const updateMenu = asyncHandler(async (req, res) => {
  const { date, mealType, items, startTime, endTime, description } = req.body;

  const menu = await Menu.findById(req.params.id);
  if (!menu) {
    throw new AppError('Menu not found.', 404, 'MENU_NOT_FOUND');
  }

  const nextDate = date || menu.date;
  const nextMealType = mealType || menu.mealType;

  if (nextDate !== menu.date || nextMealType !== menu.mealType) {
    const duplicate = await Menu.findOne({
      _id: { $ne: menu._id },
      date: nextDate,
      mealType: nextMealType,
    });
    if (duplicate) {
      throw new AppError(
        `A ${nextMealType} menu already exists for ${nextDate}.`,
        409,
        'DUPLICATE_MENU'
      );
    }
  }

  menu.date = nextDate;
  menu.mealType = nextMealType;
  if (items) menu.items = items;
  if (startTime) menu.startTime = startTime;
  if (endTime) menu.endTime = endTime;
  if (description !== undefined) menu.description = description;
  menu.createdBy = req.user._id;

  await menu.save();

  await notifyActiveStudents({
    title: `${menu.mealType} Menu Updated`,
    message: `The ${menu.mealType.toLowerCase()} menu for ${menu.date} has been updated.`,
    type: 'menu',
  });

  res.status(200).json({
    success: true,
    message: 'Menu updated successfully.',
    data: { menu },
  });
});

const deleteMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findByIdAndDelete(req.params.id);
  if (!menu) {
    throw new AppError('Menu not found.', 404, 'MENU_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Menu deleted successfully.',
  });
});

const WEEKDAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};
const WEEKLY_MEAL_ORDER = { Breakfast: 1, Lunch: 2, Snacks: 3, Dinner: 4 };

const getWeeklyMenus = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.dayOfWeek && WEEKDAY_ORDER[req.query.dayOfWeek]) {
    filter.dayOfWeek = req.query.dayOfWeek;
  }

  const menus = await WeeklyMenu.find(filter).lean();
  menus.sort((a, b) => {
    const dayDiff = (WEEKDAY_ORDER[a.dayOfWeek] || 9) - (WEEKDAY_ORDER[b.dayOfWeek] || 9);
    if (dayDiff !== 0) return dayDiff;
    return (WEEKLY_MEAL_ORDER[a.mealType] || 9) - (WEEKLY_MEAL_ORDER[b.mealType] || 9);
  });

  res.status(200).json({
    success: true,
    data: {
      weekdays: WeeklyMenu.WEEKDAYS,
      mealTypes: WeeklyMenu.MEAL_TYPES,
      menus,
    },
  });
});

const updateWeeklyMenu = asyncHandler(async (req, res) => {
  const { mealName, items, startTime, endTime, description, isPublished } = req.body;

  const slot = await WeeklyMenu.findById(req.params.id);
  if (!slot) {
    throw new AppError('Weekly menu slot not found.', 404, 'MENU_NOT_FOUND');
  }

  if (mealName !== undefined) slot.mealName = mealName.trim() || slot.mealType;
  if (items !== undefined) slot.items = items;
  if (startTime !== undefined) slot.startTime = startTime;
  if (endTime !== undefined) slot.endTime = endTime;
  if (description !== undefined) slot.description = description;
  if (typeof isPublished === 'boolean') slot.isPublished = isPublished;
  slot.updatedBy = req.user._id;

  await slot.save();

  if (slot.isPublished) {
    await notifyActiveStudents({
      title: `${slot.dayOfWeek} ${slot.mealType} Updated`,
      message: `ABES Boys' Hostel ${slot.dayOfWeek} ${slot.mealType.toLowerCase()} menu (${slot.startTime} - ${slot.endTime}) has been updated.`,
      type: 'menu',
    });
  }

  res.status(200).json({
    success: true,
    message: `${slot.dayOfWeek} ${slot.mealType} menu updated successfully.`,
    data: { menu: slot },
  });
});

const upsertWeeklyMenuSlot = asyncHandler(async (req, res) => {
  const { dayOfWeek, mealType, mealName, items, startTime, endTime, description, isPublished } =
    req.body;

  const slot = await WeeklyMenu.findOneAndUpdate(
    { dayOfWeek, mealType },
    {
      $set: {
        dayOfWeek,
        mealType,
        mealName: (mealName && mealName.trim()) || `${dayOfWeek} ${mealType}`,
        items: items || [],
        startTime,
        endTime,
        description: description || '',
        isPublished: typeof isPublished === 'boolean' ? isPublished : true,
        updatedBy: req.user._id,
      },
    },
    { upsert: true, returnDocument: 'after', runValidators: true }
  );

  if (slot.isPublished) {
    await notifyActiveStudents({
      title: `${slot.dayOfWeek} ${slot.mealType} Updated`,
      message: `ABES Boys' Hostel ${slot.dayOfWeek} ${slot.mealType.toLowerCase()} menu has been updated.`,
      type: 'menu',
    });
  }

  res.status(200).json({
    success: true,
    message: `${dayOfWeek} ${mealType} menu saved successfully.`,
    data: { menu: slot },
  });
});

const toggleWeeklyMenuPublish = asyncHandler(async (req, res) => {
  const slot = await WeeklyMenu.findById(req.params.id);
  if (!slot) {
    throw new AppError('Weekly menu slot not found.', 404, 'MENU_NOT_FOUND');
  }

  const nextPublished =
    typeof req.body?.isPublished === 'boolean' ? req.body.isPublished : !slot.isPublished;

  slot.isPublished = nextPublished;
  slot.updatedBy = req.user._id;
  await slot.save();

  if (nextPublished) {
    await notifyActiveStudents({
      title: `${slot.dayOfWeek} ${slot.mealType} Published`,
      message: `The ${slot.dayOfWeek} ${slot.mealType.toLowerCase()} menu is now published.`,
      type: 'menu',
    });
  }

  res.status(200).json({
    success: true,
    message: `${slot.dayOfWeek} ${slot.mealType} ${nextPublished ? 'published' : 'unpublished'}.`,
    data: { menu: slot },
  });
});

module.exports = {
  getDashboard,
  getStudents,
  getStudentById,
  updateStudentStatus,
  getCoupons,
  getAnalytics,
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu,
  getWeeklyMenus,
  updateWeeklyMenu,
  upsertWeeklyMenuSlot,
  toggleWeeklyMenuPublish,
};
