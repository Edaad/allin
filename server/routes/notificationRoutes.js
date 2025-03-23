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

// Get unread notification count for a user (more specific route first)
router.get('/notifications/unread/:userId', getUnreadCount);

// Get all notifications for a user with optional filters (more general route second)
router.get('/notifications/:userId', getNotifications);

// Mark a notification as read
router.put('/notifications/:id/read', markAsRead);

// Mark all notifications as read for a user
router.put('/notifications/:userId/read-all', markAllAsRead);

// Delete a specific notification
router.delete('/notifications/:id', deleteNotification);

// Delete all notifications for a user
router.delete('/notifications/:userId/all', deleteAllNotifications);

module.exports = router;