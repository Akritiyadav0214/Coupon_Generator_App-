const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    couponId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
      default: 'Lunch',
      required: true,
    },
    couponDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Coupon date must be YYYY-MM-DD'],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REDEEMED', 'EXPIRED'],
      default: 'ACTIVE',
      required: true,
    },
    verificationToken: {
      type: String,
      required: true,
      trim: true,
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

// Prevent duplicate daily coupon generation per student per meal type at the database level
couponSchema.index({ student: 1, couponDate: 1, mealType: 1 }, { unique: true });
couponSchema.index({ couponDate: 1, status: 1 });
couponSchema.index({ verificationToken: 1 });
couponSchema.index({ generatedAt: -1 });

module.exports = mongoose.model('Coupon', couponSchema);
