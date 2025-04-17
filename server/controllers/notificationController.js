// controllers/notificationController.js
const notificationService = require('../services/notificationService');

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, read } = req.query;
    
    const result = await notificationService.getNotifications(userId, { page, limit, read });
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const count = await notificationService.getUnreadCount(userId);
    
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await notificationService.markAsRead(id);
    
    res.status(200).json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    if (err.message === 'Notification not found') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await notificationService.deleteNotification(id);
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error deleting notification:', err);
    if (err.message === 'Notification not found') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete all notifications for a user
const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await notificationService.deleteAllNotifications(userId);
    
    res.status(200).json(result);
  } catch (err) {
    console.error('Error deleting all notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};