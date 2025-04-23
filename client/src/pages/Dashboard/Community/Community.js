// src/pages/Dashboard/Community/Community.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Profile from '../../../components/Profile/Profile';
import GroupCard from '../../../components/GroupCard/GroupCard';
import CreateGroupModal from '../../../components/CreateGroupModal/CreateGroupModal';
import { motion } from 'framer-motion';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');
    const [query, setQuery] = useState("");
    const [data, setData] = useState([]);
    const [groups, setGroups] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
    const [filterGroupsBy, setFilterGroupsBy] = useState('all'); // all, my-groups, joined
    const [searchFocused, setSearchFocused] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [animateProfiles, setAnimateProfiles] = useState(false);

    const fetchData = useMemo(
        () =>
            debounce(async (searchQuery) => {
                if (!user) return;

                try {
                    // Only fetch users if not on Groups tab
                    if (activeTab !== 'Groups') {
                        setHasSearched(true);
                        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                            params: {
                                query: searchQuery.length >= 3 ? searchQuery : '',
                                tab: activeTab,
                                userId: user._id,
                            },
                        });
                        setData(res.data);
                        setAnimateProfiles(true);
                        // Reset animation flag after animation delay
                        setTimeout(() => setAnimateProfiles(false), 500);
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }, 200),
        [user, activeTab]
    );

    const fetchGroups = useCallback(async () => {
        if (!user) return;

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
        }
    }, [user, filterGroupsBy]);

    useEffect(() => {
        if (activeTab === 'Groups') {
            fetchGroups();
        } else {
            fetchData(query);
        }
    }, [query, activeTab, user, fetchData, fetchGroups, filterGroupsBy]);

    useEffect(() => {
        return () => {
            fetchData.cancel();
        };
    }, [fetchData]);

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

    const handleSearchChange = (e) => {
        setQuery(e.target.value);
    };

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setQuery(''); // Reset search when changing tabs
        setHasSearched(false);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' },
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
                        <motion.h1 
                            initial={{ opacity: 0, y: -20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Community
                        </motion.h1>
                    </div>
                    {/* Removed Friend Suggestions as requested */}
                </>
            ) : <h1>Loading...</h1>}
                
                <motion.div 
                    className="tab-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {['All', 'Friends', 'PendingRequests', 'Invitations', 'Groups'].map((tab) => (
                        <motion.button
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
                            {tab === activeTab && <motion.div className="tab-indicator" layoutId="indicator" />}
                        </motion.button>
                    ))}
                </motion.div>

                {activeTab === 'Groups' ? (
                    <motion.div 
                        className="groups-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="groups-actions">
                            <motion.button
                                className="create-group-button"
                                onClick={() => setCreateGroupModalOpen(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                + Create New Group
                            </motion.button>

                            <div className="groups-filter">
                                {['all', 'my-groups', 'joined'].map((filter) => (
                                    <motion.button
                                        key={filter}
                                        className={`filter-button ${filterGroupsBy === filter ? 'active' : ''}`}
                                        onClick={() => setFilterGroupsBy(filter)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {filter === 'all' ? 'All Groups' : 
                                         filter === 'my-groups' ? 'My Groups' : 'Joined Groups'}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <motion.div 
                            className="groups-list"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {groups.length > 0 ? (
                                groups.map((group, index) => (
                                    <motion.div 
                                        key={group._id}
                                        variants={itemVariants}
                                        custom={index}
                                        className="group-card-wrapper"
                                    >
                                        <GroupCard
                                            group={group}
                                            user={user}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.p 
                                    className="no-groups-message"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {getEmptyMessage()}
                                </motion.p>
                            )}
                        </motion.div>

                        <CreateGroupModal
                            open={createGroupModalOpen}
                            onClose={() => setCreateGroupModalOpen(false)}
                            user={user}
                            onGroupCreated={handleGroupCreated}
                        />
                    </motion.div>
                ) : (
                    <>
                        <motion.div 
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
                                    value={query}
                                    onChange={handleSearchChange}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                                {query && (
                                    <button 
                                        className="clear-search"
                                        onClick={() => setQuery('')}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </motion.div>

                        <motion.div 
                            className={`profiles-container ${animateProfiles ? 'animate' : ''}`}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {data.filter(item => item._id !== user?._id).length > 0 ? (
                                <div className="profiles-grid">
                                    {data.filter(item => item._id !== user?._id).map((item, index) => (
                                        <motion.div 
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
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div 
                                    className="empty-state"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {hasSearched && query ? (
                                        <>
                                            <div className="empty-icon">🔍</div>
                                            <h3>{getNoUserFoundMessage()}</h3>
                                            <p>Try a different search term</p>
                                        </>
                                    ) : activeTab !== 'All' && !query ? (
                                        <>
                                            <div className="empty-icon">
                                                {activeTab === 'Friends' ? '👥' : 
                                                 activeTab === 'PendingRequests' ? '⏳' : 
                                                 activeTab === 'Invitations' ? '✉️' : '🙋'}
                                            </div>
                                            <h3>{getEmptyMessage()}</h3>
                                                {activeTab === 'Friends' && (
                                                    <motion.button
                                                    className="create-group-button"
                                                    onClick={() => setCreateGroupModalOpen(true)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    + Add Friends
                                                </motion.button>
                                            )}
                                        </>
                                    ) : !hasSearched ? (
                                        <>
                                            <div className="empty-icon">👋</div>
                                            <h3>Connect with other players</h3>
                                            <p>Search for people to add as friends</p>
                                        </>
                                    ) : null}
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Community;