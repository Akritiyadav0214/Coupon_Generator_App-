const Notification = require('../models/Notification');
const User = require('../models/User');

async function createNotification({ userId, title, message, type = 'system' }) {
  return Notification.create({
    user: userId,
    title,
    message,
    type,
  });
}

async function notifyActiveStudents({ title, message, type = 'menu' }) {
  const students = await User.find({ role: 'student', isActive: true }).select('_id').lean();
  if (!students.length) return;

  const docs = students.map((s) => ({
    user: s._id,
    title,
    message,
    type,
  }));
  await Notification.insertMany(docs, { ordered: false });
}

async function getUserNotifications(userId, { limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(safeLimit).lean(),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return { notifications, unreadCount };
}

async function markNotificationRead(userId, notificationId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true } },
    { returnDocument: 'after' }
  );
}

async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
  return result.modifiedCount;
}

module.exports = {
  createNotification,
  notifyActiveStudents,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
