// src/pages/Dashboard/Community/Community.js (Updated)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../../components/Input/Input';
import '../Dashboard.css';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Profile from '../../../components/Profile/Profile';
import GroupCard from '../../../components/GroupCard/GroupCard';
import CreateGroupModal from '../../../components/CreateGroupModal/CreateGroupModal';
import FriendSuggestions from '../../../components/FriendSuggestions/FriendSuggestion';

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

    const fetchData = useMemo(
        () =>
            debounce(async (searchQuery) => {
                if (!user) return;

                try {
                    // Only fetch users if not on Groups tab
                    if (activeTab !== 'Groups') {
                        const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                            params: {
                                query: searchQuery.length >= 3 ? searchQuery : '',
                                tab: activeTab,
                                userId: user._id,
                            },
                        });
                        setData(res.data);
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

    // const requestToJoinGroup = async (groupId) => {
    //     try {
    //         await axios.post(`${process.env.REACT_APP_API_URL}/group-members/request-to-join`, {
    //             userId: user._id,
    //             groupId: groupId
    //         });

    //         // Update local state to reflect the change
    //         setGroups(prevGroups => 
    //             prevGroups.map(group => 
    //                 group._id === groupId 
    //                     ? {...group, membershipStatus: 'requested'} 
    //                     : group
    //             )
    //         );
    //     } catch (error) {
    //         console.error('Error requesting to join group:', error);
    //     }
    // };

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

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? (
                <>
                    <div className='dashboard-heading'><h1>Community</h1></div>
                    {activeTab === 'All' && <FriendSuggestions user={user} updateUserState={updateUserState} />}
                </>
            ) : <h1>Loading...</h1>}
                <div className="tab-container">
                    <button onClick={() => setActiveTab('All')} className={`tab${activeTab === 'All' ? '-selected' : ''}`}>All</button>
                    <button onClick={() => setActiveTab('Friends')} className={`tab${activeTab === 'Friends' ? '-selected' : ''}`}>Friends</button>
                    <button onClick={() => setActiveTab('PendingRequests')} className={`tab${activeTab === 'PendingRequests' ? '-selected' : ''}`}>Pending Requests</button>
                    <button onClick={() => setActiveTab('Invitations')} className={`tab${activeTab === 'Invitations' ? '-selected' : ''}`}>Invitations</button>
                    <button onClick={() => setActiveTab('Groups')} className={`tab${activeTab === 'Groups' ? '-selected' : ''}`}>Groups</button>
                </div>

                {activeTab === 'Groups' ? (
                    <div className="groups-container">
                        <div className="groups-actions">
                            <button
                                className="create-group-button"
                                onClick={() => setCreateGroupModalOpen(true)}
                            >
                                + Create New Group
                            </button>

                            <div className="groups-filter">
                                <button
                                    className={`filter-button ${filterGroupsBy === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterGroupsBy('all')}
                                >
                                    All Groups
                                </button>
                                <button
                                    className={`filter-button ${filterGroupsBy === 'my-groups' ? 'active' : ''}`}
                                    onClick={() => setFilterGroupsBy('my-groups')}
                                >
                                    My Groups
                                </button>
                                <button
                                    className={`filter-button ${filterGroupsBy === 'joined' ? 'active' : ''}`}
                                    onClick={() => setFilterGroupsBy('joined')}
                                >
                                    Joined Groups
                                </button>
                            </div>
                        </div>

                        <div className="groups-list">
                            {groups.length > 0 ? (
                                groups.map(group => (
                                    <GroupCard
                                        key={group._id}
                                        group={group}
                                        user={user}
                                    />
                                ))
                            ) : (
                                <p className="no-groups-message">{getEmptyMessage()}</p>
                            )}
                        </div>

                        <CreateGroupModal
                            open={createGroupModalOpen}
                            onClose={() => setCreateGroupModalOpen(false)}
                            user={user}
                            onGroupCreated={handleGroupCreated}
                        />
                    </div>
                ) : (
                    <>
                        <Input
                            name='search'
                            type='text'
                            placeholder='Search for members in the community by their name or username..'
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className='all-profiles-container'>
                            {data.filter(item => item._id !== user?._id).length > 0 ? (
                                data.filter(item => item._id !== user?._id).map((item) => (
                                    <Profile key={item._id} data={item} currentUser={user} refreshData={fetchData} updateUserState={updateUserState} />
                                ))
                            ) : (
                                <p>{!query && getEmptyMessage()}{query && getNoUserFoundMessage()}</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Community;