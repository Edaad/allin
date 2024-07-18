import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

export function Host() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('host');

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    console.log(user);

    const menus = [{ title: 'Overview', page: 'overview' }, { title: 'Host', page: 'host' }, { title: 'Community', page: 'community' }, { title: 'Bankroll', page: 'bankroll' }];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Host</h1></div> : <h1>Loading...</h1>}
            </div>
        </div>
    );
}
