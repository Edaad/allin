// src/services/notificationService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Get notifications for a user
 * @param {string} userId - The user ID
 * @param {Object} params - Query parameters (page, limit, read)
 * @returns {Promise} - Promise resolving to notifications data
 */
export const getNotifications = async (userId, params = {}) => {
    try {
        const response = await axios.get(`${API_URL}/notifications/${userId}`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - The user ID
 * @returns {Promise} - Promise resolving to the count
 */
export const getUnreadCount = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/notifications/unread/${userId}`);
        return response.data.count;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw error;
    }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @returns {Promise}
 */
export const markAsRead = async (notificationId) => {
    try {
        await axios.put(`${API_URL}/notifications/${notificationId}/read`);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {Promise}
 */
export const markAllAsRead = async (userId) => {
    try {
        await axios.put(`${API_URL}/notifications/${userId}/read-all`);
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Delete a notification
 * @param {string} notificationId - The notification ID
 * @returns {Promise}
 */
export const deleteNotification = async (notificationId) => {
    try {
        await axios.delete(`${API_URL}/notifications/${notificationId}`);
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - The user ID
 * @returns {Promise}
 */
export const deleteAllNotifications = async (userId) => {
    try {
        await axios.delete(`${API_URL}/notifications/${userId}/all`);
    } catch (error) {
        console.error('Error deleting all notifications:', error);
        throw error;
    }
};

// Fix: Assign the object to a variable before exporting
const notificationService = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};

export default notificationService;