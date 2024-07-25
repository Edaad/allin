import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Input from '../../components/Input/Input';
import '../Dashboard/Dashboard.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import Profile from '../../components/Profile/Profile';
import '../Dashboard/Community/Community.css'

export function Playground3() {
    const [user, setUser] = useState({ username: "edaadpoker10" });
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('community');
    const [query, setQuery] = useState("");
    const [data, setData] = useState([{ "names": { "firstName": "Tanzif", "lastName": "Chowdhury" }, "_id": "6698b517f42fc41f2dc8deee", "username": "tanzifchow", "password": "$2b$10$YDJo98auA9ywGtPCnK2w/.RWbHuPyXuRp8RSqf8khZpiGfYKE5X4a", "email": "tanzif.chowdhury@gmail.com", "created_at": "2024-07-18T06:24:23.464Z", "updated_at": "2024-07-18T06:24:23.465Z", "__v": 0 }, { "names": { "firstName": "Idan", "lastName": "Hussain" }, "_id": "6698b6e083dcf5a12e82f418", "username": "idan123gamer", "password": "$2b$10$RrDk0Kq844ZF4mGQT5Bl5uU0YdC44F5V2WpiliFh1R153fs24rXr.", "email": "idan.hussain@gmail.com", "created_at": "2024-07-18T06:32:00.305Z", "updated_at": "2024-07-18T06:32:00.305Z", "__v": 0 }, { "names": { "firstName": "Tazeem", "lastName": "Hassan" }, "_id": "6698b70983dcf5a12e82f41c", "username": "kingtazeem12", "password": "$2b$10$Toin2NFVXmwycfRvJaEajejHBe1CIa7sPQTqffTo7u4MYqBDm8Jt2", "email": "tazeem.hassan@gmail.com", "created_at": "2024-07-18T06:32:41.204Z", "updated_at": "2024-07-18T06:32:41.204Z", "__v": 0 }]);

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const res = await axios.get(`http://localhost:3001/users`, {
    //                 params: {
    //                     query: query
    //                 }
    //             });
    //             setData(res.data);
    //         } catch (error) {
    //             console.error('Error fetching data:', error);
    //         }
    //     };
    //     fetchData();
    // }, [query]);

    // useEffect(() => {
    //     const loggedUser = JSON.parse(localStorage.getItem('user'));
    //     if (loggedUser && loggedUser._id === userId) {
    //         setUser(loggedUser);
    //     } else {
    //         navigate('/signin');
    //     }
    // }, [userId, navigate]);

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
