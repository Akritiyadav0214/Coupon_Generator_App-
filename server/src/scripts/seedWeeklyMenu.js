require('dotenv').config();
const connectDB = require('../config/db');
const WeeklyMenu = require('../models/WeeklyMenu');
const User = require('../models/User');

/**
 * Official ABES Boys' Hostel (ABESEC & ABESBS, Ghaziabad) Weekly Mess Menu
 * Caterer: Naina Caters (I Year & II Year)
 */
const ABES_WEEKLY_MENU = [
  // ================= MONDAY =================
  {
    dayOfWeek: 'Monday',
    mealType: 'Breakfast',
    mealName: 'Monday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Tea brewed with tulsi, elaichi & adrakh. Served with fresh banana.',
    isPublished: true,
    items: [
      { name: 'Veg Fried Idli', category: 'Main Course', isVeg: true },
      { name: 'Plain Idli / Sambhar Bada', category: 'Main Course', isVeg: true },
      { name: 'Sambhar', category: 'Side Dish', isVeg: true },
      { name: 'Coconut Chutney', category: 'Side Dish', isVeg: true },
      { name: 'Lal Chutney', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Milk', category: 'Beverage', isVeg: true },
      { name: 'Banana', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Monday',
    mealType: 'Lunch',
    mealName: 'Monday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Mix veg includes 15% paneer; salad has radish, carrot, beetroot & onion.',
    isPublished: true,
    items: [
      { name: 'Mix Veg.', category: 'Main Course', isVeg: true },
      { name: 'Rajma', category: 'Main Course', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Boondi Raita', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Monday',
    mealType: 'Snacks',
    mealName: 'Monday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Served hot with chilly & tomato sauce.',
    isPublished: true,
    items: [
      { name: 'Burger', category: 'Main Course', isVeg: true },
      { name: 'Sauce (Chilly & Tomato)', category: 'Side Dish', isVeg: true },
      { name: 'Roohafza', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Monday',
    mealType: 'Dinner',
    mealName: 'Monday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Matar Mushroom + Moong Dal Halwa served once in a month.',
    isPublished: true,
    items: [
      { name: 'Arhar Daal', category: 'Main Course', isVeg: true },
      { name: 'Aloo Shimla Mirch', category: 'Side Dish', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Suji Halwa', category: 'Dessert', description: 'Matar Mushroom + Moong Dal Halwa once in month', isVeg: true },
      { name: 'Chhach', category: 'Beverage', isVeg: true },
    ],
  },

  // ================= TUESDAY =================
  {
    dayOfWeek: 'Tuesday',
    mealType: 'Breakfast',
    mealName: 'Tuesday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Served with fresh seasonal watermelon.',
    isPublished: true,
    items: [
      { name: 'Matar Kulche', category: 'Main Course', isVeg: true },
      { name: 'Milk', category: 'Beverage', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Watermelon', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Tuesday',
    mealType: 'Lunch',
    mealName: 'Tuesday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Traditional Tahri lunch with Hari Chutney & Curd.',
    isPublished: true,
    items: [
      { name: 'Tahri', category: 'Staples', isVeg: true },
      { name: 'Aaloo Tamatar Sabji', category: 'Main Course', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
      { name: 'Hari Chutney', category: 'Side Dish', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Tuesday',
    mealType: 'Snacks',
    mealName: 'Tuesday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Evening macaroni & hot coffee.',
    isPublished: true,
    items: [
      { name: 'Macroni', category: 'Main Course', isVeg: true },
      { name: 'Tomato & Chilly Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Coffee', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Tuesday',
    mealType: 'Dinner',
    mealName: 'Tuesday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Served with Mango / Butter Scotch / Chocolate Icecream.',
    isPublished: true,
    items: [
      { name: 'Kali Masoor Dal', category: 'Main Course', isVeg: true },
      { name: 'Bhindi', category: 'Side Dish', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Icecream (Mango / Butter Scotch / Chocolate)', category: 'Dessert', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Achar', category: 'Salad & Extras', isVeg: true },
    ],
  },

  // ================= WEDNESDAY =================
  {
    dayOfWeek: 'Wednesday',
    mealType: 'Breakfast',
    mealName: 'Wednesday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Hot stuffed paratha with curd & muskmelon.',
    isPublished: true,
    items: [
      { name: 'Aaloo Paratha', category: 'Main Course', isVeg: true },
      { name: 'Pickle', category: 'Side Dish', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Muskmelon', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Wednesday',
    mealType: 'Lunch',
    mealName: 'Wednesday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Kaabli Chhole & Kashifal with Jeera Rice.',
    isPublished: true,
    items: [
      { name: 'Kaabli Chhole (Small)', category: 'Main Course', isVeg: true },
      { name: 'Kashifal', category: 'Side Dish', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Jeera Rice', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Wednesday',
    mealType: 'Snacks',
    mealName: 'Wednesday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Hot samosa with sauces & masala tea.',
    isPublished: true,
    items: [
      { name: 'Samosa', category: 'Main Course', isVeg: true },
      { name: 'Tomato & Chilly Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Wednesday',
    mealType: 'Dinner',
    mealName: 'Wednesday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Special paneer dinner with Puri & Pulaw.',
    isPublished: true,
    items: [
      { name: 'Butter Paneer Masala / Kadhai Paneer', category: 'Main Course', isVeg: true },
      { name: 'Aaloo Jeera', category: 'Side Dish', isVeg: true },
      { name: 'Puri', category: 'Staples', isVeg: true },
      { name: 'Pulaw', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
    ],
  },

  // ================= THURSDAY =================
  {
    dayOfWeek: 'Thursday',
    mealType: 'Breakfast',
    mealName: 'Thursday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Mumbai-style Pav Bhaji with butter & fresh papaya.',
    isPublished: true,
    items: [
      { name: 'Pav Bhaji', category: 'Main Course', isVeg: true },
      { name: 'Butter', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Milk', category: 'Beverage', isVeg: true },
      { name: 'Papaya', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Thursday',
    mealType: 'Lunch',
    mealName: 'Thursday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Kadhi Chawal & Aaloo Pyaj Sabji with fried papad.',
    isPublished: true,
    items: [
      { name: 'Aaloo Pyaj Sabji', category: 'Side Dish', isVeg: true },
      { name: 'Kadhi', category: 'Main Course', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Papad Fried', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Thursday',
    mealType: 'Snacks',
    mealName: 'Thursday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Hot pakodis & bread pakoda with tea.',
    isPublished: true,
    items: [
      { name: 'Mix Pakodi / Bread Pakoda', category: 'Main Course', isVeg: true },
      { name: 'Chilli & Tomato Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Thursday',
    mealType: 'Dinner',
    mealName: 'Thursday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Daal Makhani & Mix Veg served with Gulab Jamun.',
    isPublished: true,
    items: [
      { name: 'Daal Makhani', category: 'Main Course', isVeg: true },
      { name: 'Mix Veg', category: 'Side Dish', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Gulab Jamun', category: 'Dessert', isVeg: true },
      { name: 'Chhachh', category: 'Beverage', isVeg: true },
      { name: 'Achar', category: 'Salad & Extras', isVeg: true },
    ],
  },

  // ================= FRIDAY =================
  {
    dayOfWeek: 'Friday',
    mealType: 'Breakfast',
    mealName: 'Friday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Stuffed Aaloo Paratha with curd, pickle & banana.',
    isPublished: true,
    items: [
      { name: 'Aaloo Paratha', category: 'Main Course', isVeg: true },
      { name: 'Pickle', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Banana', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Friday',
    mealType: 'Lunch',
    mealName: 'Friday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Aaloo Matar Jeera & Arhar Daal with Boondi Raita.',
    isPublished: true,
    items: [
      { name: 'Aaloo Matar Jeera', category: 'Side Dish', isVeg: true },
      { name: 'Arhar Daal', category: 'Main Course', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Boondi Raita', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Friday',
    mealType: 'Snacks',
    mealName: 'Friday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Hot vegetable chowmein with refreshing shikanji.',
    isPublished: true,
    items: [
      { name: 'Chowmein', category: 'Main Course', isVeg: true },
      { name: 'Chilly & Tomato Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Shikanji', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Friday',
    mealType: 'Dinner',
    mealName: 'Friday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Chhole, Dam Aaloo & Plain Paratha with sweet custard.',
    isPublished: true,
    items: [
      { name: 'Chhole', category: 'Main Course', isVeg: true },
      { name: 'Dam Aaloo', category: 'Side Dish', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Plain Paratha', category: 'Staples', isVeg: true },
      { name: 'Custard', category: 'Dessert', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Achar', category: 'Salad & Extras', isVeg: true },
    ],
  },

  // ================= SATURDAY =================
  {
    dayOfWeek: 'Saturday',
    mealType: 'Breakfast',
    mealName: 'Saturday Breakfast',
    startTime: '07:30',
    endTime: '09:30',
    description: 'Weekend Puri-Sabji & hot Jalebi with watermelon.',
    isPublished: true,
    items: [
      { name: 'Aaloo Tamatar Sabji', category: 'Main Course', isVeg: true },
      { name: 'Puri', category: 'Staples', isVeg: true },
      { name: 'Mirchi', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Jalebi', category: 'Dessert', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Watermelon', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Saturday',
    mealType: 'Lunch',
    mealName: 'Saturday Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Light weekend Mix Dal & Taroi thali.',
    isPublished: true,
    items: [
      { name: 'Mix Dal', category: 'Main Course', isVeg: true },
      { name: 'Taroi', category: 'Side Dish', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Curd', category: 'Side Dish', isVeg: true },
      { name: 'Lemon 1/2', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Saturday',
    mealType: 'Snacks',
    mealName: 'Saturday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'Crispy bread roll with sauces & tea.',
    isPublished: true,
    items: [
      { name: 'Bread Roll', category: 'Main Course', isVeg: true },
      { name: 'Chilly & Tomato Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Tea', category: 'Beverage', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Saturday',
    mealType: 'Dinner',
    mealName: 'Saturday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Homestyle Arhar Dal & Lauki with Chhachh.',
    isPublished: true,
    items: [
      { name: 'Arhar Dal', category: 'Main Course', isVeg: true },
      { name: 'Lauki', category: 'Side Dish', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Mix Salad', category: 'Salad & Extras', isVeg: true },
      { name: 'Chhachh', category: 'Beverage', isVeg: true },
    ],
  },

  // ================= SUNDAY =================
  {
    dayOfWeek: 'Sunday',
    mealType: 'Breakfast',
    mealName: 'Sunday Breakfast',
    startTime: '08:00',
    endTime: '10:00',
    description: 'Sunday special Aaloo Sandwich, Cornflakes & Mix Fruit.',
    isPublished: true,
    items: [
      { name: 'Aaloo Sandwich', category: 'Main Course', isVeg: true },
      { name: 'Tomato Sauce', category: 'Side Dish', isVeg: true },
      { name: 'Cornflakes', category: 'Staples', isVeg: true },
      { name: 'Milk', category: 'Beverage', isVeg: true },
      { name: 'Tea', category: 'Beverage', description: 'With tulsi, elaichi & adrakh', isVeg: true },
      { name: 'Mix Fruit + Chat Masala', category: 'Salad & Extras', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Sunday',
    mealType: 'Lunch',
    mealName: 'Sunday Special Lunch',
    startTime: '12:30',
    endTime: '14:30',
    description: 'Sunday feast: Chhole Bhature, Jeera Rice & Cold Drink.',
    isPublished: true,
    items: [
      { name: 'Chhole Kabuli (Big)', category: 'Main Course', isVeg: true },
      { name: 'Bhature', category: 'Staples', isVeg: true },
      { name: 'Fry Mirch', category: 'Side Dish', isVeg: true },
      { name: 'Sirka Pyaz', category: 'Salad & Extras', isVeg: true },
      { name: 'Jeera Rice', category: 'Staples', isVeg: true },
      { name: 'Cold Drink', category: 'Beverage', isVeg: true },
      { name: 'Pickle', category: 'Salad & Extras', isVeg: true },
      { name: 'Veg Raita', category: 'Side Dish', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Sunday',
    mealType: 'Snacks',
    mealName: 'Sunday Evening Snacks',
    startTime: '17:00',
    endTime: '18:00',
    description: 'OFF — Evening snacks are closed on Sunday as per the official ABES hostel schedule.',
    isPublished: false,
    items: [
      { name: 'OFF (No Evening Snacks on Sunday)', category: 'Side Dish', isVeg: true },
    ],
  },
  {
    dayOfWeek: 'Sunday',
    mealType: 'Dinner',
    mealName: 'Sunday Dinner',
    startTime: '19:30',
    endTime: '21:30',
    description: 'Lauki Kofta & Arabi served with Kheer / Sewai.',
    isPublished: true,
    items: [
      { name: 'Lauki Kofta', category: 'Main Course', isVeg: true },
      { name: 'Arabi', category: 'Side Dish', isVeg: true },
      { name: 'Rice', category: 'Staples', isVeg: true },
      { name: 'Roti', category: 'Staples', isVeg: true },
      { name: 'Chhachh', category: 'Beverage', isVeg: true },
      { name: 'Kheer / Sewai', category: 'Dessert', isVeg: true },
    ],
  },
];

async function seedWeeklyMenus(adminUserId = null, { force = false } = {}) {
  let resolvedAdminId = adminUserId;
  if (!resolvedAdminId) {
    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    resolvedAdminId = admin?._id;
  }

  let inserted = 0;
  let updated = 0;

  for (const entry of ABES_WEEKLY_MENU) {
    const payload = {
      ...entry,
      ...(resolvedAdminId ? { updatedBy: resolvedAdminId } : {}),
    };

    if (force) {
      await WeeklyMenu.findOneAndUpdate(
        { dayOfWeek: entry.dayOfWeek, mealType: entry.mealType },
        { $set: payload },
        { upsert: true, returnDocument: 'after' }
      );
      updated += 1;
    } else {
      const existing = await WeeklyMenu.findOne({
        dayOfWeek: entry.dayOfWeek,
        mealType: entry.mealType,
      }).lean();

      if (!existing) {
        await WeeklyMenu.create(payload);
        inserted += 1;
      }
    }
  }

  return {
    totalSlots: ABES_WEEKLY_MENU.length,
    inserted,
    updated,
  };
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  connectDB()
    .then(() => seedWeeklyMenus(null, { force }))
    .then((summary) => {
      if (force) {
        console.log(
          `ABES Weekly Menu reset complete: ${summary.updated} meal slots upserted (Monday–Sunday).`
        );
      } else {
        console.log(
          `ABES Weekly Menu seed complete: ${summary.inserted} new slots inserted (${summary.totalSlots} total Monday–Sunday slots ensured).`
        );
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Weekly menu seed failed:', err);
      process.exit(1);
    });
}

module.exports = {
  ABES_WEEKLY_MENU,
  seedWeeklyMenus,
};
