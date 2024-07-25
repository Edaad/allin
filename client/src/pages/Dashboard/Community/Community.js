import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../../components/Input/Input';
import '../Dashboard.css';
import './Community.css'
import Sidebar from '../../../components/Sidebar/Sidebar';
import Profile from '../../../components/Profile/Profile';

export function Community() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');
    const [query, setQuery] = useState("");
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:3001/users`, {
                    params: {
                        query: query
                    }
                });
                setData(res.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [query]);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

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
                    placeholder='Search for friends in the community by their name, username, or email..'
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ marginBottom: "20px" }}
                />
                <div className='all-profiles-container'>
                    {data.filter(item => item._id !== userId).map((item) => (
                        <Profile data={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}
