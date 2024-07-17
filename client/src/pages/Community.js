import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import './stylesheets/Dashboard.css';
import '../App.css';
import Sidebar from '../components/Sidebar';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');

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
                {user ? <div className='dashboard-heading'><h1>Community</h1></div> : <h1>Loading...</h1>}
                <Input
                    name='search'
                    type='text'
                    placeholder='Search for friends in the community by their username..'
                />
                <p style={{ fontWeight: "500" }}>Friends:</p>
            </div>
        </div>
    );
}
