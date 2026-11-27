const { AppError, asyncHandler } = require('../utils/errors');
const {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../services/notificationService');

const getNotifications = asyncHandler(async (req, res) => {
  const data = await getUserNotifications(req.user._id, {
    limit: req.query.limit,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const updated = await markNotificationRead(req.user._id, req.params.id);
  if (!updated) {
    throw new AppError('Notification not found.', 404, 'NOTIFICATION_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { notification: updated },
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const modifiedCount = await markAllNotificationsRead(req.user._id);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
    data: { modifiedCount },
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
