require('dotenv').config();
const connectDB = require('../config/db');
const Menu = require('../models/Menu');
const User = require('../models/User');
const { getNextNDates } = require('../utils/dateUtils');

const WEEKLY_ROTATION = [
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Light & energizing morning breakfast served hot.',
      items: [
        { name: 'Poha', category: 'Main Course', description: 'Flattened rice tossed with mustard seeds, onions & peanuts', isVeg: true },
        { name: 'Bread and Butter', category: 'Staples', description: 'Toasted bread slices with salted butter', isVeg: true },
        { name: 'Tea', category: 'Beverage', description: 'Hot ginger & cardamom masala chai', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm toned milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Wholesome homestyle campus lunch thali.',
      items: [
        { name: 'Dal', category: 'Main Course', description: 'Yellow lentil tadka tempered with cumin and garlic', isVeg: true },
        { name: 'Rice', category: 'Staples', description: 'Steamed long-grain white rice', isVeg: true },
        { name: 'Roti', category: 'Staples', description: 'Soft whole-wheat phulka rotis', isVeg: true },
        { name: 'Paneer Curry', category: 'Main Course', description: 'Fresh cottage cheese simmered in spiced gravy', isVeg: true },
        { name: 'Seasonal Vegetables', category: 'Side Dish', description: 'Fresh market seasonal stir-fry', isVeg: true },
        { name: 'Salad', category: 'Salad & Extras', description: 'Cucumber, tomato, carrot & lemon wedges', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Crispy evening tea-time snacks.',
      items: [
        { name: 'Samosa', category: 'Main Course', description: 'Spiced potato pastry with tamarind chutney', isVeg: true },
        { name: 'Masala Chai', category: 'Beverage', description: 'Freshly brewed Indian spiced tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Comforting evening meal.',
      items: [
        { name: 'Chapati', category: 'Staples', description: 'Hot whole-wheat chapatis', isVeg: true },
        { name: 'Rice', category: 'Staples', description: 'Plain steamed rice', isVeg: true },
        { name: 'Dal', category: 'Main Course', description: 'Homestyle moong & masoor dal', isVeg: true },
        { name: 'Mix Veg', category: 'Side Dish', description: 'Carrots, peas, beans & cauliflower curry', isVeg: true },
        { name: 'Pickle', category: 'Salad & Extras', description: 'Traditional mango & lime pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Stuffed paratha special morning.',
      items: [
        { name: 'Aloo Paratha', category: 'Main Course', description: 'Spiced potato-stuffed whole-wheat flatbread', isVeg: true },
        { name: 'Fresh Curd', category: 'Salad & Extras', description: 'Chilled plain yogurt', isVeg: true },
        { name: 'Tea', category: 'Beverage', description: 'Hot masala chai', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'North Indian Rajma-Chawal lunch special.',
      items: [
        { name: 'Rajma Masala', category: 'Main Course', description: 'Slow-cooked red kidney beans in rich gravy', isVeg: true },
        { name: 'Jeera Rice', category: 'Staples', description: 'Cumin-tempered basmati rice', isVeg: true },
        { name: 'Chapati', category: 'Staples', description: 'Fresh wheat chapatis', isVeg: true },
        { name: 'Bhindi Fry', category: 'Side Dish', description: 'Crispy okra with mild spices', isVeg: true },
        { name: 'Boondi Raita', category: 'Salad & Extras', description: 'Spiced yogurt with crisp boondi', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Evening refreshment counter.',
      items: [
        { name: 'Bread Pakora', category: 'Main Course', description: 'Gram-flour battered stuffed bread fritters', isVeg: true },
        { name: 'Ginger Tea', category: 'Beverage', description: 'Fresh ginger-infused tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Light dinner with protein-rich lentils.',
      items: [
        { name: 'Phulka Roti', category: 'Staples', description: 'Light ghee-brushed rotis', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Steamed rice', isVeg: true },
        { name: 'Moong Dal Tadka', category: 'Main Course', description: 'Split yellow moong dal with cumin tempering', isVeg: true },
        { name: 'Aloo Gobhi', category: 'Side Dish', description: 'Cauliflower and potato dry curry', isVeg: true },
        { name: 'Mango Pickle', category: 'Salad & Extras', description: 'Spiced mango pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'South Indian steamed breakfast.',
      items: [
        { name: 'Idli & Sambar', category: 'Main Course', description: 'Soft steamed rice cakes with vegetable lentil stew', isVeg: true },
        { name: 'Coconut Chutney', category: 'Side Dish', description: 'Fresh ground coconut & curry-leaf chutney', isVeg: true },
        { name: 'Filter Coffee', category: 'Beverage', description: 'South Indian brewed coffee', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Hearty chickpeas and greens lunch.',
      items: [
        { name: 'Chole Masala', category: 'Main Course', description: 'Punjabi-style spiced chickpea curry', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Fluffy steamed rice', isVeg: true },
        { name: 'Roti', category: 'Staples', description: 'Whole-wheat rotis', isVeg: true },
        { name: 'Cabbage Peas Sabzi', category: 'Side Dish', description: 'Lightly spiced shredded cabbage & green peas', isVeg: true },
        { name: 'Kachumber Salad', category: 'Salad & Extras', description: 'Diced cucumber, onion & tomato with chaat masala', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Evening sandwich & chai.',
      items: [
        { name: 'Grilled Veg Sandwich', category: 'Main Course', description: 'Cucumber, tomato & mint chutney sandwich', isVeg: true },
        { name: 'Masala Chai', category: 'Beverage', description: 'Hot spiced tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Spinach cottage cheese dinner special.',
      items: [
        { name: 'Chapati', category: 'Staples', description: 'Soft wheat chapatis', isVeg: true },
        { name: 'Veg Pulao', category: 'Staples', description: 'Aromatic rice cooked with peas and whole spices', isVeg: true },
        { name: 'Masoor Dal', category: 'Main Course', description: 'Red lentil curry', isVeg: true },
        { name: 'Palak Paneer', category: 'Main Course', description: 'Cottage cheese cubes in creamy spinach puree', isVeg: true },
        { name: 'Mixed Pickle', category: 'Salad & Extras', description: 'Tangy mixed vegetable pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Warm semolina upma and protein sides.',
      items: [
        { name: 'Vegetable Upma', category: 'Main Course', description: 'Roasted semolina cooked with carrots, peas & cashews', isVeg: true },
        { name: 'Boiled Eggs / Banana', category: 'Side Dish', description: 'Choice of boiled eggs or fresh banana', isVeg: false },
        { name: 'Tea', category: 'Beverage', description: 'Hot masala tea', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Traditional Kadhi Pakora & Rice lunch.',
      items: [
        { name: 'Kadhi Pakora', category: 'Main Course', description: 'Tangy yogurt-gram flour curry with onion fritters', isVeg: true },
        { name: 'Basmati Rice', category: 'Staples', description: 'Steamed aromatic basmati rice', isVeg: true },
        { name: 'Roti', category: 'Staples', description: 'Whole-wheat rotis', isVeg: true },
        { name: 'Aloo Methi', category: 'Side Dish', description: 'Potatoes sauteed with fresh fenugreek leaves', isVeg: true },
        { name: 'Cucumber Salad', category: 'Salad & Extras', description: 'Fresh sliced cucumber & carrots', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Light evening bites.',
      items: [
        { name: 'Veg Cutlet', category: 'Main Course', description: 'Crispy vegetable & potato patties', isVeg: true },
        { name: 'Lemon Tea', category: 'Beverage', description: 'Refreshing honey-lemon tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Rich Dal Makhani dinner.',
      items: [
        { name: 'Tandoori Roti', category: 'Staples', description: 'Crisp whole-wheat tandoori rotis', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Plain steamed rice', isVeg: true },
        { name: 'Dal Makhani', category: 'Main Course', description: 'Slow-simmered black lentils finished with cream', isVeg: true },
        { name: 'Bhindi Masala', category: 'Side Dish', description: 'Onion-tomato spiced okra', isVeg: true },
        { name: 'Garlic Pickle', category: 'Salad & Extras', description: 'Spiced garlic pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Crispy dosa & sambar morning.',
      items: [
        { name: 'Masala Dosa', category: 'Main Course', description: 'Crisp fermented crepe filled with spiced potato mash', isVeg: true },
        { name: 'Sambar & Tomato Chutney', category: 'Side Dish', description: 'Traditional South Indian accompaniments', isVeg: true },
        { name: 'Coffee', category: 'Beverage', description: 'Hot brewed coffee', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Matar Paneer & Chana Dal lunch thali.',
      items: [
        { name: 'Matar Paneer', category: 'Main Course', description: 'Green peas & cottage cheese in tomato-onion gravy', isVeg: true },
        { name: 'Chana Dal Fry', category: 'Main Course', description: 'Bengal gram lentils tempered with red chillies', isVeg: true },
        { name: 'Jeera Rice', category: 'Staples', description: 'Fragrant cumin rice', isVeg: true },
        { name: 'Chapati', category: 'Staples', description: 'Soft wheat chapatis', isVeg: true },
        { name: 'Green Salad & Papad', category: 'Salad & Extras', description: 'Fresh salad with roasted papad', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Street-style evening snack.',
      items: [
        { name: 'Bhel Puri', category: 'Main Course', description: 'Puffed rice tossed with chutneys, sev & onions', isVeg: true },
        { name: 'Masala Chai', category: 'Beverage', description: 'Hot spiced tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Homestyle smoky eggplant & dal dinner.',
      items: [
        { name: 'Chapati', category: 'Staples', description: 'Fresh wheat chapatis', isVeg: true },
        { name: 'Plain Rice', category: 'Staples', description: 'Steamed white rice', isVeg: true },
        { name: 'Arhar Dal', category: 'Main Course', description: 'Classic pigeon pea yellow dal', isVeg: true },
        { name: 'Baingan Bharta', category: 'Side Dish', description: 'Roasted mashed eggplant with peas and spices', isVeg: true },
        { name: 'Chilli Pickle', category: 'Salad & Extras', description: 'Stuffed red chilli pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Savoury vermicelli & toasted bread.',
      items: [
        { name: 'Vermicelli Upma', category: 'Main Course', description: 'Semiyan cooked with mustard seeds & mixed veggies', isVeg: true },
        { name: 'Bread Toast & Jam', category: 'Staples', description: 'Crisp toast with mixed fruit jam', isVeg: true },
        { name: 'Tea', category: 'Beverage', description: 'Hot masala chai', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Balanced weekday lunch.',
      items: [
        { name: 'Dal Tadka', category: 'Main Course', description: 'Ghee-tempered yellow lentils', isVeg: true },
        { name: 'Aloo Matar', category: 'Side Dish', description: 'Potatoes & green peas in mild curry', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Long-grain steamed rice', isVeg: true },
        { name: 'Roti', category: 'Staples', description: 'Soft whole-wheat rotis', isVeg: true },
        { name: 'Mix Veg Raita & Salad', category: 'Salad & Extras', description: 'Chilled cucumber-onion raita and salad', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Warm evening fritters.',
      items: [
        { name: 'Aloo Bonda', category: 'Main Course', description: 'Spiced potato dumplings with mint chutney', isVeg: true },
        { name: 'Ginger Tea', category: 'Beverage', description: 'Hot ginger tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'High-protein soya curry & peas pulao.',
      items: [
        { name: 'Phulka Roti', category: 'Staples', description: 'Hot wheat phulkas', isVeg: true },
        { name: 'Peas Pulao', category: 'Staples', description: 'Basmati rice with green peas', isVeg: true },
        { name: 'Dal Fry', category: 'Main Course', description: 'Onion-tomato spiced lentil fry', isVeg: true },
        { name: 'Soyabean Curry', category: 'Side Dish', description: 'Nutritious soya chunks in spiced gravy', isVeg: true },
        { name: 'Mango Pickle', category: 'Salad & Extras', description: 'Tangy mango pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '08:00',
      endTime: '10:00',
      description: 'Weekend special breakfast.',
      items: [
        { name: 'Chole Bhature', category: 'Main Course', description: 'Spiced chickpeas with puffed fried bread', isVeg: true },
        { name: 'Mint Chutney & Onion', category: 'Salad & Extras', description: 'Fresh coriander-mint dip', isVeg: true },
        { name: 'Tea', category: 'Beverage', description: 'Hot masala chai', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Special Veg Biryani lunch feast.',
      items: [
        { name: 'Veg Biryani', category: 'Main Course', description: 'Layered saffron basmati rice with marinated vegetables', isVeg: true },
        { name: 'Mirchi Ka Salan', category: 'Side Dish', description: 'Creamy peanut-sesame gravy', isVeg: true },
        { name: 'Dal Tadka', category: 'Main Course', description: 'Tempered yellow lentils', isVeg: true },
        { name: 'Chapati', category: 'Staples', description: 'Soft wheat chapatis', isVeg: true },
        { name: 'Onion Raita & Salad', category: 'Salad & Extras', description: 'Chilled raita and fresh salad', isVeg: true },
        { name: 'Gulab Jamun', category: 'Dessert', description: 'Warm milk-solid dumplings in cardamom syrup', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Evening pasta & tea.',
      items: [
        { name: 'Masala Macaroni', category: 'Main Course', description: 'Indian-style spiced vegetable pasta', isVeg: true },
        { name: 'Tea', category: 'Beverage', description: 'Freshly brewed tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Light & soothing dinner.',
      items: [
        { name: 'Chapati', category: 'Staples', description: 'Whole-wheat chapatis', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Steamed rice', isVeg: true },
        { name: 'Yellow Dal', category: 'Main Course', description: 'Mildly spiced yellow lentils', isVeg: true },
        { name: 'Lauki Chana Sabzi', category: 'Side Dish', description: 'Bottle gourd cooked with Bengal gram', isVeg: true },
        { name: 'Lemon Pickle', category: 'Salad & Extras', description: 'Sweet & tangy lime pickle', isVeg: true },
      ],
    },
  },
  {
    Breakfast: {
      startTime: '07:30',
      endTime: '09:30',
      description: 'Protein-packed besan chilla & toast.',
      items: [
        { name: 'Besan Chilla', category: 'Main Course', description: 'Savoury gram-flour pancakes with coriander & onions', isVeg: true },
        { name: 'Bread and Butter', category: 'Staples', description: 'Fresh bread slices with butter', isVeg: true },
        { name: 'Coffee', category: 'Beverage', description: 'Hot brewed coffee', isVeg: true },
        { name: 'Milk', category: 'Beverage', description: 'Warm milk', isVeg: true },
      ],
    },
    Lunch: {
      startTime: '12:00',
      endTime: '14:30',
      description: 'Royal Shahi Paneer & Panchmel Dal thali.',
      items: [
        { name: 'Shahi Paneer', category: 'Main Course', description: 'Cottage cheese in creamy cashew-tomato gravy', isVeg: true },
        { name: 'Dal Panchmel', category: 'Main Course', description: 'Five-lentil Rajasthani specialty', isVeg: true },
        { name: 'Steamed Rice', category: 'Staples', description: 'Fluffy steamed rice', isVeg: true },
        { name: 'Roti', category: 'Staples', description: 'Fresh whole-wheat rotis', isVeg: true },
        { name: 'Jeera Aloo', category: 'Side Dish', description: 'Cumin-roasted baby potatoes', isVeg: true },
        { name: 'Garden Salad', category: 'Salad & Extras', description: 'Crisp cucumber, beetroot & tomato', isVeg: true },
      ],
    },
    Snacks: {
      startTime: '16:30',
      endTime: '18:00',
      description: 'Crispy evening pakoras.',
      items: [
        { name: 'Onion Pakora', category: 'Main Course', description: 'Spiced crispy onion fritters', isVeg: true },
        { name: 'Masala Chai', category: 'Beverage', description: 'Hot spiced tea', isVeg: true },
      ],
    },
    Dinner: {
      startTime: '19:30',
      endTime: '21:30',
      description: 'Wholesome khichdi & mix veg dinner.',
      items: [
        { name: 'Chapati', category: 'Staples', description: 'Soft wheat chapatis', isVeg: true },
        { name: 'Veg Khichdi', category: 'Staples', description: 'Comforting rice & lentil medley with ghee', isVeg: true },
        { name: 'Dal', category: 'Main Course', description: 'Homestyle tempered dal', isVeg: true },
        { name: 'Mix Veg Curry', category: 'Side Dish', description: 'Seasonal mixed vegetables in mild gravy', isVeg: true },
        { name: 'Pickle', category: 'Salad & Extras', description: 'Traditional mango pickle', isVeg: true },
      ],
    },
  },
];

function buildSampleMenus(days = 8, adminUserId = undefined) {
  const dates = getNextNDates(days);
  const docs = [];

  dates.forEach((dateStr, idx) => {
    const dayPlan = WEEKLY_ROTATION[idx % WEEKLY_ROTATION.length];
    Object.entries(dayPlan).forEach(([mealType, details]) => {
      docs.push({
        date: dateStr,
        mealType,
        startTime: details.startTime,
        endTime: details.endTime,
        description: details.description,
        items: details.items,
        ...(adminUserId ? { createdBy: adminUserId } : {}),
      });
    });
  });

  return docs;
}

async function seedMenus(adminUserId = null, days = 8) {
  let resolvedAdminId = adminUserId;
  if (!resolvedAdminId) {
    const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
    resolvedAdminId = admin?._id;
  }

  const menuDocs = buildSampleMenus(days, resolvedAdminId);
  let inserted = 0;

  for (const menu of menuDocs) {
    const existing = await Menu.findOne({ date: menu.date, mealType: menu.mealType }).lean();
    if (!existing) {
      await Menu.create(menu);
      inserted += 1;
    }
  }

  return { totalChecked: menuDocs.length, inserted, days };
}

if (require.main === module) {
  connectDB()
    .then(() => seedMenus(null, 8))
    .then((summary) => {
      console.log(
        `Menu seed complete: ${summary.inserted} new menus inserted (${summary.totalChecked} slots ensured across ${summary.days} days).`
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error('Menu seed failed:', err);
      process.exit(1);
    });
}

module.exports = {
  WEEKLY_ROTATION,
  buildSampleMenus,
  seedMenus,
};
