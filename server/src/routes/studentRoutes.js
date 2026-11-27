const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { protect, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect, requireRole('student'));

router.get('/dashboard', studentController.getDashboard);
router.get('/profile', studentController.getProfile);
router.put(
  '/profile',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 80 }),
    body('email').trim().isEmail().withMessage('Please provide a valid email address'),
    body('department').trim().notEmpty().withMessage('Department is required').isLength({ max: 80 }),
    body('semester').isInt({ min: 1, max: 12 }).withMessage('Semester must be between 1 and 12'),
  ],
  validate,
  studentController.updateProfile
);

router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
  ],
  validate,
  studentController.changePassword
);

router.get('/coupons', studentController.getCoupons);
router.get('/coupons/today', studentController.getTodayCoupon);
router.post('/coupons/generate', studentController.generateTodayCoupon);
router.get('/menu', studentController.getMenu);

module.exports = router;
