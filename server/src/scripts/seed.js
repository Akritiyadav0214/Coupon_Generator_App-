require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const {
  getTodayDateString,
  getEndOfDayDate,
  getCompactDateString,
  getLastNDates,
} = require('../utils/dateUtils');
const { generateCouponId, generateVerificationToken } = require('../utils/couponCrypto');
const { seedMenus } = require('./seedMenus');
const { seedWeeklyMenus } = require('./seedWeeklyMenu');

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

  const menuSummary = await seedMenus(adminUser?._id, 8);
  console.log(
    `Ensured ${menuSummary.totalChecked} date menu slots (${menuSummary.inserted} newly inserted).`
  );

  const weeklySummary = await seedWeeklyMenus(adminUser?._id);
  console.log(
    `Ensured ${weeklySummary.totalSlots} ABES weekly menu slots (${weeklySummary.inserted} newly inserted).`
  );

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
