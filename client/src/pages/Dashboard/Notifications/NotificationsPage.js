// src/pages/Dashboard/Notifications/NotificationsPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './NotificationsPage.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

export function NotificationsPage() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    // Fixed: Using the page variable directly instead of state since it's constant
    const page = 'notifications';
    const [notifications, setNotifications] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    // Fetch notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;

            setIsLoading(true);
            try {
                const params = {
                    page: currentPage,
                    limit: 20
                };

                if (filter === 'unread') {
                    params.read = false;
                } else if (filter === 'read') {
                    params.read = true;
                }

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/notifications/${userId}`,
                    { params }
                );

                setNotifications(response.data.notifications);
                setTotalPages(response.data.totalPages);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, [user, userId, currentPage, filter]);

    // Handle mark as read
    const handleMarkAsRead = async (id) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/notifications/${id}/read`);
            setNotifications(notifications.map(notification =>
                notification._id === id ? { ...notification, read: true } : notification
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle mark selected as read
    const handleMarkSelectedAsRead = async () => {
        try {
            await Promise.all(
                selectedNotifications.map(id =>
                    axios.put(`${process.env.REACT_APP_API_URL}/notifications/${id}/read`)
                )
            );

            setNotifications(notifications.map(notification =>
                selectedNotifications.includes(notification._id)
                    ? { ...notification, read: true }
                    : notification
            ));

            setSelectedNotifications([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/notifications/${userId}/read-all`);
            setNotifications(notifications.map(notification => ({ ...notification, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Handle delete notification
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${id}`);
            setNotifications(notifications.filter(notification => notification._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Handle delete selected notifications
    const handleDeleteSelected = async () => {
        try {
            await Promise.all(
                selectedNotifications.map(id =>
                    axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${id}`)
                )
            );

            setNotifications(notifications.filter(notification =>
                !selectedNotifications.includes(notification._id)
            ));

            setSelectedNotifications([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error deleting notifications:', error);
        }
    };

    // Handle delete all notifications
    const handleDeleteAll = async () => {
        const confirm = window.confirm('Are you sure you want to delete all notifications?');
        if (!confirm) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/notifications/${userId}/all`);
            setNotifications([]);
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    };

    // Handle notification click - navigate to the relevant page
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }

        // Navigate to the relevant page
        if (notification.link) {
            navigate(notification.link);
        }
    };

    // Handle select notification
    const handleSelectNotification = (event, id) => {
        event.stopPropagation();

        if (selectedNotifications.includes(id)) {
            setSelectedNotifications(selectedNotifications.filter(notificationId => notificationId !== id));
        } else {
            setSelectedNotifications([...selectedNotifications, id]);
        }
    };

    // Handle select all notifications
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(notifications.map(notification => notification._id));
        }
        setSelectAll(!selectAll);
    };

    // Format date
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    // Group notifications by date
    const groupNotificationsByDate = () => {
        const groups = {};

        notifications.forEach(notification => {
            const date = new Date(notification.created_at);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            let dateKey;
            if (date.toDateString() === today.toDateString()) {
                dateKey = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateKey = 'Yesterday';
            } else {
                dateKey = date.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }

            groups[dateKey].push(notification);
        });

        return groups;
    };

    const groupedNotifications = groupNotificationsByDate();
    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Notifications', page: 'notifications' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} page={page} username={user.username} />}
            <div className='logged-content-container'>
                <div className='dashboard-heading'>
                    <h1>Notifications</h1>
                </div>

                <div className="notifications-controls">
                    <div className="notifications-filters">
                        <button
                            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread
                        </button>
                        <button
                            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                            onClick={() => setFilter('read')}
                        >
                            Read
                        </button>
                    </div>

                    <div className="notifications-actions">
                        {selectedNotifications.length > 0 ? (
                            <>
                                <button className="action-btn" onClick={handleMarkSelectedAsRead}>
                                    Mark Selected as Read
                                </button>
                                <button className="action-btn delete" onClick={handleDeleteSelected}>
                                    Delete Selected
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="action-btn" onClick={handleMarkAllAsRead}>
                                    Mark All as Read
                                </button>
                                <button className="action-btn delete" onClick={handleDeleteAll}>
                                    Delete All
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="notifications-loading">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                        <div className="empty-icon">🔔</div>
                        <h3>No notifications</h3>
                        <p>You don't have any notifications at the moment.</p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        <div className="select-all-container">
                            <label className="select-all">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                />
                                Select All
                            </label>
                            <span className="notification-count">
                                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {Object.entries(groupedNotifications).map(([date, notificationsGroup]) => (
                            <div key={date} className="notifications-group">
                                <div className="notifications-date">{date}</div>

                                {notificationsGroup.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifications.includes(notification._id)}
                                                onChange={(e) => handleSelectNotification(e, notification._id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>

                                        <div className="notification-content">
                                            <div className="notification-header">
                                                <div className="notification-title">{notification.title}</div>
                                                <div className="notification-time">
                                                    {formatDate(notification.created_at)}
                                                </div>
                                            </div>
                                            <div className="notification-message">{notification.message}</div>

                                            <div className="notification-actions">
                                                {!notification.read && (
                                                    <button
                                                        className="mark-read-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification._id);
                                                        }}
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(notification._id);
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="notifications-pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>

                                <div className="pagination-pages">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                        <button
                                            key={pageNum}
                                            className={currentPage === pageNum ? 'active' : ''}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificationsPage;