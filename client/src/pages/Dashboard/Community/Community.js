// src/pages/Dashboard/Community/Community.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Profile from '../../../components/Profile/Profile';
import GroupCard from '../../../components/GroupCard/GroupCard';
import CreateGroupModal from '../../../components/CreateGroupModal/CreateGroupModal';
// import { motion } from 'framer-motion';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');
    const [searchTerm, setSearchTerm] = useState(""); // Local search term for immediate filtering
    const [allData, setAllData] = useState([]); // Store all data for local filtering
    const [data, setData] = useState([]); // Filtered data to display
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [filterGroupsBy, setFilterGroupsBy] = useState('all'); // all, my-groups, joined
    const [searchFocused, setSearchFocused] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [animateProfiles, setAnimateProfiles] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch data from API only when tab changes or on initial load
    const fetchData = useCallback(async () => {
        if (!user) return;

        // Only fetch users if not on Groups tab
        if (activeTab !== 'Groups') {
            setLoading(true);
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                    params: {
                        query: '', // Fetch all data for the active tab
                        tab: activeTab,
                        userId: user._id,
                    },
                });
                setAllData(res.data);
                setData(res.data); // Initially show all data
                setAnimateProfiles(true);
                setTimeout(() => setAnimateProfiles(false), 500);
                setHasSearched(true);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [user, activeTab]);

    // Filter data locally based on search term
    useEffect(() => {
        if (activeTab !== 'Groups' && allData.length > 0) {
            if (searchTerm.trim() === '') {
                setData(allData);
                return;
            }

            const searchTermLower = searchTerm.toLowerCase();
            const filtered = allData.filter(item => {
                const fullName = `${item.names?.firstName || ''} ${item.names?.lastName || ''}`.toLowerCase();
                const username = (item.username || '').toLowerCase();

                return fullName.includes(searchTermLower) || username.includes(searchTermLower);
            });

            setData(filtered);
            setHasSearched(true);
        }
    }, [searchTerm, allData, activeTab]);

    const fetchGroups = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            let endpoint;
            let params = {};

            if (filterGroupsBy === 'my-groups') {
                // Fetch groups where the user is admin
                params = { admin_id: user._id, userId: user._id };
                endpoint = '/groups';
            } else if (filterGroupsBy === 'joined') {
                // Fetch groups where the user is a member
                endpoint = `/groups/user/${user._id}`;
                params = { membership_status: 'accepted' };
            } else {
                // Fetch all public groups + groups where user is a member
                endpoint = '/groups';
                params = { is_public: true, userId: user._id };
            }

            const res = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`, { params });
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    }, [user, filterGroupsBy]);

    // Refetch when tab or filter changes
    useEffect(() => {
        if (activeTab === 'Groups') {
            fetchGroups();
        } else {
            fetchData();
        }
    }, [activeTab, fetchData, fetchGroups, filterGroupsBy]);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    const updateUserState = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const handleGroupCreated = () => {
        // Refresh the groups list
        fetchGroups();
    };

    // Handle search input immediately for local filtering
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // When changing tabs, reset search and fetch new data
    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setSearchTerm('');
        setHasSearched(false);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Notifications', page: 'notifications' }
    ];

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'Friends':
                return 'You currently have no friends';
            case 'PendingRequests':
                return 'You currently have no pending requests';
            case 'Invitations':
                return 'You currently have no invitations';
            case 'Groups':
                if (filterGroupsBy === 'my-groups') return 'You haven\'t created any groups yet';
                if (filterGroupsBy === 'joined') return 'You haven\'t joined any groups yet';
                return 'There are no public groups available';
            case 'All':
                return '';
            default:
                return '';
        }
    };

    const getNoUserFoundMessage = () => {
        switch (activeTab) {
            case 'Friends':
                return 'There are no friends that match your search';
            case 'PendingRequests':
                return 'There are no pending requests that match your search';
            case 'Invitations':
                return 'There are no invitations that match your search';
            case 'All':
                return 'There are no members in the community that match your search';
            default:
                return '';
        }
    };

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    const tabVariants = {
        inactive: {
            color: "#9f9f9f",
            fontWeight: "normal",
        },
        active: {
            color: "#343434",
            fontWeight: "500",
            scale: 1.05,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? (
                    <>
                        <div className='dashboard-heading'>
                            <h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                Community
                            </h1>
                        </div>
                        {/* Removed Friend Suggestions as requested */}
                    </>
                ) : <h1>Loading...</h1>}

                <div
                    className="tab-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {['All', 'Friends', 'PendingRequests', 'Invitations', 'Groups'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabChange(tab)}
                            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                            variants={tabVariants}
                            initial="inactive"
                            animate={activeTab === tab ? "active" : "inactive"}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {tab === 'PendingRequests' ? 'Pending Requests' : tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Groups' ? (
                    <div
                        className="groups-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="groups-actions">
                            <button
                                className="create-group-button"
                                onClick={() => setCreateGroupModalOpen(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                + Create New Group
                            </button>

                            <div className="groups-filter">
                                {['all', 'my-groups', 'joined'].map((filter) => (
                                    <button
                                        key={filter}
                                        className={`filter-button ${filterGroupsBy === filter ? 'active' : ''}`}
                                        onClick={() => setFilterGroupsBy(filter)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {filter === 'all' ? 'All Groups' :
                                            filter === 'my-groups' ? 'My Groups' : 'Joined Groups'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <p>Loading groups...</p>
                            </div>
                        ) : (
                            <div
                                className="groups-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {groups.length > 0 ? (
                                    groups.map((group, index) => (
                                        <div
                                            key={group._id}
                                            variants={itemVariants}
                                            custom={index}
                                            className="group-card-wrapper"
                                        >
                                            <GroupCard
                                                group={group}
                                                user={user}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <p
                                        className="no-groups-message"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {getEmptyMessage()}
                                    </p>
                                )}
                            </div>
                        )}

                        <CreateGroupModal
                            open={createGroupModalOpen}
                            onClose={() => setCreateGroupModalOpen(false)}
                            user={user}
                            onGroupCreated={handleGroupCreated}
                        />
                    </div>
                ) : (
                    <>
                        <div
                            className="search-container"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className={`search-input-wrapper ${searchFocused ? 'focused' : ''}`}>
                                <i className="search-icon fa-solid fa-search"></i>
                                <input
                                    className="search-input"
                                    type="text"
                                    placeholder={`Search for ${activeTab.toLowerCase() === 'all' ? 'people' : activeTab.toLowerCase()} by name or username...`}
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                                {searchTerm && (
                                    <button
                                        className="clear-search"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <p>Loading users...</p>
                            </div>
                        ) : (
                            <div
                                className={`profiles-container ${animateProfiles ? 'animate' : ''}`}
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {data.filter(item => item._id !== user?._id).length > 0 ? (
                                    <div className="profiles-grid">
                                        {data.filter(item => item._id !== user?._id).map((item, index) => (
                                            <div
                                                key={item._id}
                                                className="profile-card-wrapper"
                                                variants={itemVariants}
                                                custom={index}
                                            >
                                                <Profile
                                                    data={item}
                                                    currentUser={user}
                                                    refreshData={fetchData}
                                                    updateUserState={updateUserState}
                                                    className="profile-card-enhanced"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        className="empty-state"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {hasSearched && searchTerm ? (
                                            <>
                                                <div className="empty-icon">🔍</div>
                                                <h3>{getNoUserFoundMessage()}</h3>
                                                <p>Try a different search term</p>
                                            </>
                                        ) : activeTab !== 'All' && !searchTerm ? (
                                            <>
                                                <div className="empty-icon">
                                                    {activeTab === 'Friends' ? '👥' :
                                                        activeTab === 'PendingRequests' ? '⏳' :
                                                            activeTab === 'Invitations' ? '✉️' : '🙋'}
                                                </div>
                                                <h3>{getEmptyMessage()}</h3>
                                                {activeTab === 'Friends' && (
                                                    <button
                                                        className="create-group-button"
                                                        onClick={() => handleTabChange('All')}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        + Add Friends
                                                    </button>
                                                )}
                                            </>
                                        ) : !hasSearched ? (
                                            <>
                                                <div className="empty-icon">👋</div>
                                                <h3>Connect with other players</h3>
                                                <p>Search for people to add as friends</p>
                                            </>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Community;