require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Menu = require('../models/Menu');
const Notification = require('../models/Notification');
const {
  getTodayDateString,
  getEndOfDayDate,
  getCompactDateString,
  getLastNDates,
} = require('../utils/dateUtils');
const { generateCouponId, generateVerificationToken } = require('../utils/couponCrypto');

const SAMPLE_STUDENTS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@messmate.edu',
    studentId: 'CS2024001',
    department: 'Computer Science',
    semester: 5,
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@messmate.edu',
    studentId: 'EC2024014',
    department: 'Electronics',
    semester: 5,
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@messmate.edu',
    studentId: 'ME2023029',
    department: 'Mechanical',
    semester: 7,
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@messmate.edu',
    studentId: 'CS2025042',
    department: 'Computer Science',
    semester: 3,
  },
  {
    name: 'Kabir Patel',
    email: 'kabir.patel@messmate.edu',
    studentId: 'CE2024018',
    department: 'Civil Engineering',
    semester: 5,
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@messmate.edu',
    studentId: 'IT2024009',
    department: 'Information Technology',
    semester: 5,
  },
];

async function seed() {
  await connectDB();

  const defaultStudentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student@123';
  const passwordHash = await User.hashPassword(defaultStudentPassword);

  const studentDocs = [];
  for (const s of SAMPLE_STUDENTS) {
    let user = await User.findOne({ email: s.email });
    if (!user) {
      user = await User.create({
        ...s,
        passwordHash,
        role: 'student',
        isActive: true,
      });
    }
    studentDocs.push(user);
  }
  console.log(`Ensured ${studentDocs.length} sample students.`);

  const adminUser = await User.findOne({ role: 'admin' });
  const today = getTodayDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = getTodayDateString(tomorrowDate);

  const sampleMenus = [
    {
      date: today,
      mealType: 'Breakfast',
      startTime: '07:30',
      endTime: '09:30',
      description: 'Nutritious morning breakfast served hot in the main dining hall.',
      items: [
        { name: 'Masala Poha', category: 'Main Course', description: 'Flattened rice with peanuts and herbs', isVeg: true },
        { name: 'Idli & Sambar', category: 'Staples', description: 'Steamed rice cakes with lentil stew', isVeg: true },
        { name: 'Boiled Eggs', category: 'Side Dish', description: 'Optional protein side', isVeg: false },
        { name: 'Filter Coffee / Tea', category: 'Beverage', description: 'Freshly brewed', isVeg: true },
      ],
    },
    {
      date: today,
      mealType: 'Lunch',
      startTime: '12:00',
      endTime: '14:30',
      description: 'Freshly prepared homestyle North & South Indian lunch thali.',
      items: [
        { name: 'Dal Tadka', category: 'Main Course', description: 'Yellow lentils tempered with cumin and garlic', isVeg: true },
        { name: 'Paneer Butter Masala', category: 'Main Course', description: 'Cottage cheese simmered in rich tomato gravy', isVeg: true },
        { name: 'Steamed Basmati Rice', category: 'Staples', description: 'Fragrant long-grain rice', isVeg: true },
        { name: 'Whole Wheat Chapati', category: 'Staples', description: 'Soft tandoor-finished flatbreads', isVeg: true },
        { name: 'Green Garden Salad', category: 'Salad & Extras', description: 'Cucumber, tomato, carrot, and lemon', isVeg: true },
        { name: 'Mango Pickle & Papad', category: 'Side Dish', description: 'Traditional tang and crunch', isVeg: true },
        { name: 'Buttermilk (Chaas)', category: 'Beverage', description: 'Spiced chilled yogurt drink', isVeg: true },
      ],
    },
    {
      date: today,
      mealType: 'Snacks',
      startTime: '16:30',
      endTime: '18:00',
      description: 'Evening tea-time snacks.',
      items: [
        { name: 'Veg Cutlet', category: 'Main Course', description: 'Crispy vegetable patties with mint chutney', isVeg: true },
        { name: 'Masala Chai', category: 'Beverage', description: 'Cardamom & ginger spiced tea', isVeg: true },
      ],
    },
    {
      date: today,
      mealType: 'Dinner',
      startTime: '19:30',
      endTime: '21:30',
      description: 'Light and wholesome dinner.',
      items: [
        { name: 'Chana Masala', category: 'Main Course', description: 'Spiced chickpea curry', isVeg: true },
        { name: 'Jeera Rice', category: 'Staples', description: 'Cumin-infused steamed rice', isVeg: true },
        { name: 'Phulka Roti', category: 'Staples', description: 'Light wheat rotis', isVeg: true },
        { name: 'Gulab Jamun', category: 'Dessert', description: 'Warm milk-solid dumplings in syrup', isVeg: true },
      ],
    },
    {
      date: tomorrow,
      mealType: 'Lunch',
      startTime: '12:00',
      endTime: '14:30',
      description: 'Tomorrow special lunch menu.',
      items: [
        { name: 'Rajma Masala', category: 'Main Course', description: 'Slow-cooked red kidney bean curry', isVeg: true },
        { name: 'Aloo Gobhi Dry', category: 'Side Dish', description: 'Spiced cauliflower and potatoes', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Plain steamed rice', isVeg: true },
        { name: 'Chapati', category: 'Staples', description: 'Fresh wheat chapati', isVeg: true },
        { name: 'Boondi Raita', category: 'Salad & Extras', description: 'Chilled yogurt with crisp boondi', isVeg: true },
      ],
    },
  ];

  for (const menu of sampleMenus) {
    await Menu.findOneAndUpdate(
      { date: menu.date, mealType: menu.mealType },
      { $setOnInsert: { ...menu, createdBy: adminUser?._id } },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`Ensured ${sampleMenus.length} sample menus.`);

  // Seed 10 days of coupons idempotently
  const dates = getLastNDates(10);
  let insertedCoupons = 0;

  for (let dIdx = 0; dIdx < dates.length; dIdx += 1) {
    const dateStr = dates[dIdx];
    const isToday = dateStr === today;
    const compactDate = getCompactDateString(dateStr);

    for (let sIdx = 0; sIdx < studentDocs.length; sIdx += 1) {
      const student = studentDocs[sIdx];
      // Leave first student without today's coupon? Actually keep 1-2 active, 1-2 redeemed, and leave student 0 with no coupon today so demo student can generate one, OR generate for students 1..4!
      if (isToday && (sIdx === 0 || sIdx === 5)) continue;

      const existing = await Coupon.findOne({
        student: student._id,
        couponDate: dateStr,
        mealType: 'Lunch',
      });
      if (existing) continue;

      const couponId = generateCouponId(compactDate);
      const verificationToken = generateVerificationToken(couponId, student.studentId, dateStr);
      const [y, m, d] = dateStr.split('-').map(Number);

      let status = 'REDEEMED';
      let redeemedAt = new Date(y, m - 1, d, 12 + (sIdx % 2), 15 + sIdx * 7);
      let redeemedBy = adminUser?._id || null;

      if (isToday) {
        if (sIdx <= 2) {
          status = 'ACTIVE';
          redeemedAt = null;
          redeemedBy = null;
        }
      } else if ((dIdx + sIdx) % 5 === 0) {
        status = 'EXPIRED';
        redeemedAt = null;
        redeemedBy = null;
      }

      await Coupon.create({
        couponId,
        student: student._id,
        mealType: 'Lunch',
        couponDate: dateStr,
        generatedAt: new Date(y, m - 1, d, 9 + (sIdx % 3), 10 + sIdx * 5),
        redeemedAt,
        expiresAt: getEndOfDayDate(dateStr),
        status,
        verificationToken,
        redeemedBy,
      });
      insertedCoupons += 1;
    }
  }
  console.log(`Inserted ${insertedCoupons} sample coupons.`);

  for (const student of studentDocs) {
    const count = await Notification.countDocuments({ user: student._id });
    if (count === 0) {
      await Notification.insertMany([
        {
          user: student._id,
          title: 'Welcome to MessMate',
          message: 'Your smart digital lunch coupon account is ready.',
          type: 'account',
          read: true,
        },
        {
          user: student._id,
          title: "Today's Lunch Menu Published",
          message: 'Dal Tadka, Paneer Butter Masala, Rice & Chapati are on the menu today (12:00 - 14:30).',
          type: 'menu',
          read: false,
        },
      ]);
    }
  }
  console.log('Seed completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
