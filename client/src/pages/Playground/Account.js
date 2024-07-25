import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar'

export function Account() {

    const navigate = useNavigate()
    const [user, setUser] = useState({ names: { firstName: 'Edaad', lastName: 'Azman' }, username: 'edaadpoker10', email: 'edaad.azman@gmail.com' });
    const { userId } = useParams();
    const [page, setPage] = useState('account');

    // useEffect(() => {
    //     const loggedUser = JSON.parse(localStorage.getItem('user'));
    //     if (loggedUser && loggedUser._id === userId) {
    //         setUser(loggedUser);
    //     } else {
    //         navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
    //     }
    // }, [userId, navigate]);

    const menus = [{ title: 'Overview', page: 'overview' }, { title: 'Host', page: 'host' }, { title: 'Community', page: 'community' }, { title: 'Bankroll', page: 'bankroll' }];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Account</h1></div> : <h1>Loading...</h1>}
                <div className='account-details-container'>
                    <div>First Name: {user.names.firstName}</div>
                    <div>Last Name: {user.names.lastName}</div>
                    <div>Username: {user.username}</div>
                    <div>Email: {user.email}</div>
                </div>
            </div>
        </div>
    );
}
