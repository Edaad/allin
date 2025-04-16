// src/pages/Dashboard/Community/Community.js (Refactored)
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import TabNav from '../../../components/TabNav/TabNav';
import UsersTab from '../../../components/UsersTab/UsersTab';
import GroupsTab from '../../../components/GroupsTab/GroupsTab';
// import FriendSuggestions from '../../../components/FriendSuggestions/FriendSuggestion';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const page = 'community';
    const [activeTab, setActiveTab] = useState('All');

    // Tab configuration
    const tabs = [
        { id: 'All', label: 'All' },
        { id: 'Friends', label: 'Friends' },
        { id: 'PendingRequests', label: 'Pending Requests' },
        { id: 'Invitations', label: 'Invitations' },
        { id: 'Groups', label: 'Groups' }
    ];

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
    };

    // const updateUserState = (updatedUser) => {
    //     setUser(updatedUser);
    //     localStorage.setItem('user', JSON.stringify(updatedUser));
    // };

    return (
        <div className="dashboard">
            {user && <Sidebar page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? (
                    <>
                        <div className='dashboard-heading'><h1>Community</h1></div>
                        {/* {activeTab === 'All' && <FriendSuggestions user={user} updateUserState={updateUserState} />} */}

                        {/* Extracted tab navigation component */}
                        <TabNav
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            tabs={tabs}
                        />

                        {activeTab === 'Groups' ? (
                            /* Groups management component */
                            <GroupsTab user={user} />
                        ) : (
                            /* Users management component */
                            <UsersTab user={user} activeTab={activeTab} />
                        )}
                    </>
                ) : <h1>Loading...</h1>}
            </div>
        </div>
    );
}

export default Community;