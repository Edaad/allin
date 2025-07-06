// src/pages/Dashboard/Account/Account.js - Updated with profile management link
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import './Account.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

export function Account() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('account');

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Notifications', page: 'notifications' }
    ];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? (
                    <>
                        <div className='dashboard-heading'><h1>Account</h1></div>
                        <div className="account-container">
                            <div className="account-section">
                                <h2>Account Settings</h2>
                                <div className="account-card">
                                    <h3>User Information</h3>
                                    <div className="user-info">
                                        <p><strong>Name:</strong> {user.names.firstName} {user.names.lastName}</p>
                                        <p><strong>Username:</strong> {user.username}</p>
                                        <p><strong>Email:</strong> {user.email}</p>
                                    </div>
                                </div>

                                <div className="account-card clickable" onClick={() => navigate(`/dashboard/${userId}/profile`)}>
                                    <h3>Profile Management</h3>
                                    <p>Manage your public profile, including bio, images, social links, and poker preferences</p>
                                    <span className="card-arrow">→</span>
                                </div>

                                <div className="account-card">
                                    <h3>Password & Security</h3>
                                    <p>Update your password and security settings</p>
                                    <button className="account-button">Change Password</button>
                                </div>

                                <div className="account-card">
                                    <h3>Privacy Settings</h3>
                                    <p>Manage your privacy settings and data</p>
                                    <button className="account-button">Manage Privacy</button>
                                </div>

                                <div className="account-card danger-zone">
                                    <h3>Danger Zone</h3>
                                    <p>Permanently delete your account and all data</p>
                                    <button className="delete-button">Delete Account</button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <h1>Loading...</h1>
                )}
            </div>
        </div>
    );
}

export default Account;