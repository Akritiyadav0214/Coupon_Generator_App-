const mongoose = require('mongoose');

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

const weeklyMenuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
      maxlength: [100, 'Food item name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: ['Main Course', 'Staples', 'Side Dish', 'Beverage', 'Dessert', 'Salad & Extras'],
      default: 'Main Course',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Item description cannot exceed 200 characters'],
      default: '',
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const weeklyMenuSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: WEEKDAYS,
      required: [true, 'Weekday is required'],
    },
    mealType: {
      type: String,
      enum: MEAL_TYPES,
      required: [true, 'Meal type is required'],
    },
    mealName: {
      type: String,
      trim: true,
      maxlength: [80, 'Meal name cannot exceed 80 characters'],
      default: function defaultMealName() {
        return this.mealType;
      },
    },
    items: {
      type: [weeklyMenuItemSchema],
      default: [],
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      default: '12:00',
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      default: '14:30',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [400, 'Description cannot exceed 400 characters'],
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Guarantee one unique record per weekday + mealType
weeklyMenuSchema.index({ dayOfWeek: 1, mealType: 1 }, { unique: true });

weeklyMenuSchema.statics.WEEKDAYS = WEEKDAYS;
weeklyMenuSchema.statics.MEAL_TYPES = MEAL_TYPES;

module.exports = mongoose.model('WeeklyMenu', weeklyMenuSchema);
