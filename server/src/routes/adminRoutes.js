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

module.exports = router;
