// src/pages/Dashboard/Community/Community.js (Refactored)
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import TabNav from '../../../components/TabNav/TabNav';
import UsersTab from '../../../components/UsersTab/UsersTab';
import GroupsTab from '../../../components/GroupsTab/GroupsTab';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const page = 'community';
    const [activeTab, setActiveTab] = useState('All');
    const [isTabLoading, setIsTabLoading] = useState(false);

    // Track the current tab with a ref to prevent unnecessary renders
    const prevTabRef = React.useRef(activeTab);

    // Tab configuration - memoized to prevent recreation on render
    const tabs = useMemo(() => [
        { id: 'All', label: 'All' },
        { id: 'Friends', label: 'Friends' },
        { id: 'PendingRequests', label: 'Pending Requests' },
        { id: 'Invitations', label: 'Invitations' },
        { id: 'Groups', label: 'Groups' }
    ], []);

    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedUser = JSON.parse(localStorage.getItem('user'));
                if (loggedUser && loggedUser._id === userId) {
                    setUser(loggedUser);
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error("Error loading user data:", error);
                navigate('/signin');
            }
        };

        fetchUser();
    }, [userId, navigate]);

    // Handle tab change with loading state to improve perceived performance
    const handleTabChange = useCallback((tabId) => {
        if (tabId === prevTabRef.current) return; // Avoid unnecessary state updates

        setIsTabLoading(true); // Show loading state while changing tabs

        // Small delay to allow UI to update before heavy operations
        setTimeout(() => {
            setActiveTab(tabId);
            prevTabRef.current = tabId;

            // Add a small delay before removing loading state to prevent flickering
            setTimeout(() => {
                setIsTabLoading(false);
            }, 100);
        }, 0);
    }, []);

    // Check URL params for initial tab
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');

        if (tabParam && tabs.some(tab => tab.id === tabParam)) {
            handleTabChange(tabParam);
        }
    }, [tabs, handleTabChange]);

    // Update user state function - useful for child components
    const updateUserState = useCallback((updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    }, []);

    // Render the active tab content based on current tab
    const renderTabContent = () => {
        if (isTabLoading) {
            return <div className="tab-loading">Loading...</div>;
        }

        if (activeTab === 'Groups') {
            return <GroupsTab user={user} />;
        } else {
            return <UsersTab user={user} activeTab={activeTab} updateUserState={updateUserState} />;
        }
    };

    // If user isn't loaded yet, show a loading indicator
    if (!user) {
        return (
            <div className="dashboard">
                <Sidebar page={page} username="Loading..." />
                <div className='logged-content-container'>
                    <div className="loading-container">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <Sidebar page={page} username={user.username} />
            <div className='logged-content-container'>
                <div className='dashboard-heading'><h1>Community</h1></div>

                <TabNav
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    tabs={tabs}
                />

                {renderTabContent()}
            </div>
        </div>
    );
}

export default Community;