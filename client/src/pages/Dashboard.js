import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './stylesheets/Dashboard.css';
import '../App.css'
import Sidebar from '../components/Sidebar.js'

export function Dashboard() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('Dashboard');

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    const menus = [{ title: 'Dashboard', page: 'Dashboard' }, { title: 'Account', page: 'Account' }]

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={setPage} page={page} />
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Hi</h1> <h1 style={{ color: "rgb(53, 115, 55)" }}>{user.name}</h1></div> : <h1>Loading...</h1>}
            </div>
        </div>
    );
}
