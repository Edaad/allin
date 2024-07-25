import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';
import './Playground2.css'
import Sidebar from '../../components/Sidebar/Sidebar';
import Table from '../../components/Table/Table';
import Profile from '../../components/Profile/Profile';

export function Playground2() {
    const [user, setUser] = useState({ names: { firstName: 'Edaad', lastName: 'Azman' }, username: 'edaadpoker10' });
    const { userId, menuItem } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(menuItem || 'overview');
    const [data, setData] = useState([{ "names": { "firstName": "Edaad", "lastName": "Azman" }, "_id": "6698b44e0403e573cd26d930", "username": "edaadpoker10", "password": "$2b$10$eDA16Sp54HHYWbcTmTErTeqoh9GnzFG6ohd7HuQzyrimcTBfhfxwS", "email": "edaad.azman@gmail.com", "created_at": "2024-07-18T06:21:02.318Z", "updated_at": "2024-07-18T06:21:02.318Z", "__v": 0 }, { "names": { "firstName": "Tanzif", "lastName": "Chowdhury" }, "_id": "6698b517f42fc41f2dc8deee", "username": "tanzifchow", "password": "$2b$10$YDJo98auA9ywGtPCnK2w/.RWbHuPyXuRp8RSqf8khZpiGfYKE5X4a", "email": "tanzif.chowdhury@gmail.com", "created_at": "2024-07-18T06:24:23.464Z", "updated_at": "2024-07-18T06:24:23.465Z", "__v": 0 }, { "names": { "firstName": "Idan", "lastName": "Hussain" }, "_id": "6698b6e083dcf5a12e82f418", "username": "idan123gamer", "password": "$2b$10$RrDk0Kq844ZF4mGQT5Bl5uU0YdC44F5V2WpiliFh1R153fs24rXr.", "email": "idan.hussain@gmail.com", "created_at": "2024-07-18T06:32:00.305Z", "updated_at": "2024-07-18T06:32:00.305Z", "__v": 0 }, { "names": { "firstName": "Tazeem", "lastName": "Hassan" }, "_id": "6698b70983dcf5a12e82f41c", "username": "kingtazeem12", "password": "$2b$10$Toin2NFVXmwycfRvJaEajejHBe1CIa7sPQTqffTo7u4MYqBDm8Jt2", "email": "tazeem.hassan@gmail.com", "created_at": "2024-07-18T06:32:41.204Z", "updated_at": "2024-07-18T06:32:41.204Z", "__v": 0 }]);

    // useEffect(() => {
    //     const loggedUser = JSON.parse(localStorage.getItem('user'));
    //     if (loggedUser && loggedUser._id === userId) {
    //         setUser(loggedUser);
    //     } else {
    //         navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
    //     }
    // }, [userId, navigate]);

    // useEffect(() => {
    //     setPage(menuItem || 'overview');
    // }, [menuItem]);

    // console.log(user);

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    // Sample headers and data
    const headers = ["Name", "Host", "Location", "Date", "Seats"];
    const tableData = [
        { name: "Game 1", host: "Alice", location: "NYC", date: "2022-01-01", seats: 5, _id: 1 },
        { name: "Game 2", host: "Bob", location: "LA", date: "2022-02-01", seats: 3, _id: 2 },
        // Add more data as needed
    ];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} page={page} username={user.username} userId={user._id} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Hi</h1> <h1>{user.names.firstName} {user.names.lastName}</h1></div> : <h1>Loading...</h1>}
                <div className='overview-container'>
                    <div className='summary-item'>
                        <div className='summary-header'>
                            <h2>Summary</h2><div className='summary-header-divider'></div>
                            <div className='summary-link'>Bankroll</div>
                        </div>
                        <div className='net-bankroll-amount'>+$457</div>
                        <Table headers={headers} data={tableData} compact />
                    </div>
                    <div className='summary-secondary'>
                        <div className='summary-item'>
                            <div className='summary-header'>
                                <h2>Upcoming Games</h2>
                                <div className='summary-header-divider'></div>
                                <div className='summary-link'>Games</div>
                            </div>
                            <Table headers={headers} data={tableData} compact />
                        </div>
                        <div className='summary-item'>
                            <div className='summary-header'>
                                <h2>Friends</h2>
                                <div className='summary-header-divider'></div>
                                <div className='summary-link'>Community</div>
                            </div>
                            <div className='all-profiles-container'>
                                {data.filter(item => item._id !== userId).map((item) => (
                                    <Profile data={item} size={"compact"} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
