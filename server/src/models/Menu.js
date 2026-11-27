const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [80, 'Item name cannot exceed 80 characters'],
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

const menuSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Menu date must be YYYY-MM-DD'],
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      required: true,
      default: 'Lunch',
    },
    items: {
      type: [menuItemSchema],
      validate: {
        validator(val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'Menu must contain at least one item',
      },
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
    createdBy: {
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

menuSchema.index({ date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model('Menu', menuSchema);
