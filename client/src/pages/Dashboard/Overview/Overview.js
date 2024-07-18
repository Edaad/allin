import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

export function Overview() {
    const [user, setUser] = useState(null);
    const { userId, menuItem } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(menuItem || 'overview');

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    useEffect(() => {
        setPage(menuItem || 'overview');
    }, [menuItem]);

    console.log(user);

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} page={page} username={user.username} userId={user._id} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Hi</h1> <h1>{user.names.firstName} {user.names.lastName}</h1></div> : <h1>Loading...</h1>}
                <div>{/* Add content based on page */}</div>
            </div>
        </div>
    );
}
