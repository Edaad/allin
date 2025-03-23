// routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
} = require('../controllers/notificationController');

// Get all notifications for a user with optional filters
router.get('/notifications/:userId', getNotifications);

// Get unread notification count for a user
router.get('/notifications/unread/:userId', getUnreadCount);

// Mark a notification as read
router.put('/notifications/:id/read', markAsRead);

// Mark all notifications as read for a user
router.put('/notifications/:userId/read-all', markAllAsRead);

// Delete a specific notification
router.delete('/notifications/:id', deleteNotification);

// Delete all notifications for a user
router.delete('/notifications/:userId/all', deleteAllNotifications);

module.exports = router;