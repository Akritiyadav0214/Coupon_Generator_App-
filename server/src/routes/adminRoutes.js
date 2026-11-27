const express = require('express');
const { body, param } = require('express-validator');
const adminController = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/students', adminController.getStudents);
router.get(
  '/students/:id',
  [param('id').isMongoId().withMessage('Invalid student ID')],
  validate,
  adminController.getStudentById
);
router.patch(
  '/students/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid student ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  adminController.updateStudentStatus
);

router.get('/coupons', adminController.getCoupons);
router.get('/analytics', adminController.getAnalytics);

router.get('/menu', adminController.getMenus);
router.post(
  '/menu',
  [
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
    body('mealType')
      .isIn(['Breakfast', 'Lunch', 'Snacks', 'Dinner'])
      .withMessage('Invalid meal type'),
    body('startTime').trim().notEmpty().withMessage('Start time is required'),
    body('endTime').trim().notEmpty().withMessage('End time is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one menu item is required'),
    body('items.*.name').trim().notEmpty().withMessage('Each menu item must have a name'),
  ],
  validate,
  adminController.createMenu
);

router.put(
  '/menu/:id',
  [
    param('id').isMongoId().withMessage('Invalid menu ID'),
    body('items').optional().isArray({ min: 1 }).withMessage('Menu must have at least one item'),
  ],
  validate,
  adminController.updateMenu
);

router.delete(
  '/menu/:id',
  [param('id').isMongoId().withMessage('Invalid menu ID')],
  validate,
  adminController.deleteMenu
);

// Weekly Hostel Menu Routes (Monday–Sunday)
router.get('/weekly-menu', adminController.getWeeklyMenus);

router.put(
  '/weekly-menu/slot',
  [
    body('dayOfWeek')
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('Invalid weekday'),
    body('mealType')
      .isIn(['Breakfast', 'Lunch', 'Snacks', 'Dinner'])
      .withMessage('Invalid meal type'),
    body('startTime').trim().notEmpty().withMessage('Start time is required'),
    body('endTime').trim().notEmpty().withMessage('End time is required'),
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.name').trim().notEmpty().withMessage('Each food item must have a name'),
  ],
  validate,
  adminController.upsertWeeklyMenuSlot
);

router.put(
  '/weekly-menu/:id',
  [
    param('id').isMongoId().withMessage('Invalid weekly menu ID'),
    body('startTime').optional().trim().notEmpty().withMessage('Start time cannot be empty'),
    body('endTime').optional().trim().notEmpty().withMessage('End time cannot be empty'),
    body('items').optional().isArray().withMessage('Items must be an array'),
    body('items.*.name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Each food item must have a name'),
  ],
  validate,
  adminController.updateWeeklyMenu
);

router.patch(
  '/weekly-menu/:id/publish',
  [
    param('id').isMongoId().withMessage('Invalid weekly menu ID'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  ],
  validate,
  adminController.toggleWeeklyMenuPublish
);

module.exports = router;
