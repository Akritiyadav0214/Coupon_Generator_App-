const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 80 })
      .withMessage('Full name must be between 2 and 80 characters'),
    body('studentId')
      .trim()
      .notEmpty()
      .withMessage('Student ID / Roll Number is required')
      .isLength({ min: 3, max: 32 })
      .withMessage('Student ID must be between 3 and 32 characters'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Passwords do not match'),
    body('department')
      .trim()
      .notEmpty()
      .withMessage('Department is required')
      .isLength({ max: 80 }),
    body('semester')
      .isInt({ min: 1, max: 12 })
      .withMessage('Semester must be between 1 and 12'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Please enter a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
