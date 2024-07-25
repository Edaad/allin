import React, { useEffect, useState } from 'react';
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

    const fetchData = async () => {
        if (!user) return; // Ensure user is loaded before fetching data
        try {
            const res = await axios.get(`http://localhost:3001/users`, {
                params: {
                    query: query,
                    tab: activeTab,
                    userId: user._id
                }
            });
            setData(res.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [query, activeTab, user]);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (user) {
            console.log('User loaded:', user);
        }
    }, [user]);

    const updateUserState = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

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
                    style={{ marginBottom: "20px" }}
                />
                <div className="tab-container">
                    <button onClick={() => setActiveTab('All')} className={`tab${activeTab === 'All' ? '-selected' : ''}`}>All</button>
                    <button onClick={() => setActiveTab('Friends')} className={`tab${activeTab === 'Friends' ? '-selected' : ''}`}>Friends</button>
                    <button onClick={() => setActiveTab('PendingRequests')} className={`tab${activeTab === 'PendingRequests' ? '-selected' : ''}`}>Pending Requests</button>
                    <button onClick={() => setActiveTab('Invitations')} className={`tab${activeTab === 'Invitations' ? '-selected' : ''}`}>Invitations</button>
                </div>
                <div className='all-profiles-container'>
                    {data.filter(item => item._id !== user?._id).map((item) => (
                        <Profile key={item._id} data={item} currentUser={user} refreshData={fetchData} updateUserState={updateUserState} />
                    ))}
                </div>
            </div>
        </div>
    );
}
