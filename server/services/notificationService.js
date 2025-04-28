// services/notificationService.js
const Notification = require('../models/notification');

/**
 * Get notifications for a user with optional filters
 * @param {string} userId - User ID
 * @param {Object} options - Query options (page, limit, read status)
 * @returns {Promise<Object>} Notifications with pagination info
 */
const getNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 20, read } = options;

  const query = { user_id: userId };

  // Filter by read status if provided
  if (read !== undefined) {
    // Convert string 'true'/'false' to boolean
    query.read = read === 'true' || read === true;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Fetch notifications with pagination and sorting
  const notifications = await Notification.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('referenced_id', null, null, {
      refPath: 'referenced_model'
    });

  // Get total count for pagination
  const totalCount = await Notification.countDocuments(query);

  return {
    notifications,
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    currentPage: parseInt(page),
    totalCount
  };
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    user_id: userId,
    read: false
  });
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
const markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user_id: userId, read: false },
    { read: true }
  );

  return {
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount
  };
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Delete result
 */
const deleteNotification = async (notificationId) => {
  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    throw new Error('Notification not found');
  }

  return { message: 'Notification deleted successfully' };
};

/**
 * Delete all notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Delete result
 */
const deleteAllNotifications = async (userId) => {
  const result = await Notification.deleteMany({ user_id: userId });

  return {
    message: 'All notifications deleted',
    deletedCount: result.deletedCount
  };
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};