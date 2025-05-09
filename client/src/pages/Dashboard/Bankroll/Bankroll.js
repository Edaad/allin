import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

export function Bankroll() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const page = "bankroll"; // No need for state since this is constant

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    console.log(user);

    return (
        <div className="dashboard">
            {user && <Sidebar page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Bankroll</h1></div> : <h1>Loading...</h1>}
            </div>
        </div>
    );
}
