const express = require('express');
const { body, param } = require('express-validator');
const couponController = require('../controllers/couponController');
const { protect, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/verify',
  requireRole('admin'),
  [
    body().custom((value) => {
      if (!value?.qrData && !value?.couponId && !value?.verificationToken) {
        throw new Error('QR payload, coupon ID, or verification token is required');
      }
      return true;
    }),
  ],
  validate,
  couponController.verifyCoupon
);

router.post(
  '/redeem',
  requireRole('admin'),
  [
    body().custom((value) => {
      if (!value?.qrData && !value?.couponId && !value?.verificationToken) {
        throw new Error('QR payload, coupon ID, or verification token is required');
      }
      return true;
    }),
  ],
  validate,
  couponController.redeemCoupon
);

router.get(
  '/:couponId',
  [param('couponId').trim().notEmpty().withMessage('Coupon ID is required')],
  validate,
  couponController.getCouponById
);

module.exports = router;
