// Community.js

import React, { useEffect, useState, useMemo } from 'react';
import { debounce } from 'lodash';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../../components/Input/Input';
import '../Dashboard.css';
import './Community.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Profile from '../../../components/Profile/Profile';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');
    const [query, setQuery] = useState("");
    const [data, setData] = useState([]);
    const [activeTab, setActiveTab] = useState('All');

    const fetchData = useMemo(
        () =>
            debounce(async (searchQuery) => {
                if (!user) return;

                try {
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
                        params: {
                            query: searchQuery.length >= 3 ? searchQuery : '',
                            tab: activeTab,
                            userId: user._id,
                        },
                    });
                    setData(res.data);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }, 200),
        [user, activeTab]
    );



    useEffect(() => {
        fetchData(query);
    }, [query, activeTab, user, fetchData]);

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

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'Friends':
                return 'You currently have no friends';
            case 'PendingRequests':
                return 'You currently have no pending requests';
            case 'Invitations':
                return 'You currently have no invitations';
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
                {user ? <div className='dashboard-heading'><h1>Community</h1></div> : <h1>Loading...</h1>}
                <Input
                    name='search'
                    type='text'
                    placeholder='Search for members in the community by their name or username..'
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="tab-container">
                    <button onClick={() => setActiveTab('All')} className={`tab${activeTab === 'All' ? '-selected' : ''}`}>All</button>
                    <button onClick={() => setActiveTab('Friends')} className={`tab${activeTab === 'Friends' ? '-selected' : ''}`}>Friends</button>
                    <button onClick={() => setActiveTab('PendingRequests')} className={`tab${activeTab === 'PendingRequests' ? '-selected' : ''}`}>Pending Requests</button>
                    <button onClick={() => setActiveTab('Invitations')} className={`tab${activeTab === 'Invitations' ? '-selected' : ''}`}>Invitations</button>
                </div>
                <div className='all-profiles-container'>
                    {data.filter(item => item._id !== user?._id).length > 0 ? (
                        data.filter(item => item._id !== user?._id).map((item) => (
                            <Profile key={item._id} data={item} currentUser={user} refreshData={fetchData} updateUserState={updateUserState} />
                        ))
                    ) : (
                        <p>{!query && getEmptyMessage()}{query && getNoUserFoundMessage()}</p>
                    )}
                </div>

            </div>
        </div>
    );
}

export default Community;
