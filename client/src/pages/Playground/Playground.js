import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../Dashboard/Dashboard.css';
import Sidebar from '../../components/Sidebar/Sidebar';
import './Playground.css'
import Table from '../../components/Table/Table';
import Input from '../../components/Input/Input'

export function Playground() {
    const [user, setUser] = useState({ username: 'edaadpoker10' });
    const { userId, menuItem } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('host');
    const [hosting, setHosting] = useState(false)
    const [tab, setTab] = useState('Upcoming games')

    // useEffect(() => {
    //     const loggedUser = JSON.parse(localStorage.getItem('user'));
    //     if (loggedUser && loggedUser._id === userId) {
    //         setUser(loggedUser);
    //     } else {
    //         navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
    //     }
    // }, [userId, navigate]);

    // console.log(user);

    // useEffect(() => {
    //     setPage(menuItem || 'overview');
    // }, [menuItem]);

    // console.log(user);

    const menus = [{ title: 'Overview', page: 'overview' }, { title: 'Host', page: 'host' }, { title: 'Community', page: 'community' }, { title: 'Bankroll', page: 'bankroll' }];

    // Sample headers
    // Sample data, (bring this data from games table in db)
    const headers = ["Name", "Host", "Location", "Date", "Seats"];
    const tableData = [
        { name: "Game 1", host: "Alice", location: "NYC", date: "2022-01-01", seats: 5, _id: 1 },
        { name: "Game 2", host: "Bob", location: "LA", date: "2022-02-01", seats: 3, _id: 2 },
        // Add more data as needed
    ];
    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Host</h1></div> : <h1>Loading...</h1>}
                {hosting === false && <button className="host-button" onClick={() => setHosting(true)}>+ Host a new game</button>}
                {hosting === true && <div className='host-form-container'>
                    <form className='host-form'>
                        <Input
                            name='name'
                            type='text'
                            label='Name'
                            placeholder="Give your game a name e.g edaadpoker10's poker night"
                        />

                        <Input
                            name='location'
                            type='text'
                            label='Location'
                            placeholder='Enter the address of your game'
                        />

                        <Input
                            name='date'
                            type='text'
                            label='Date'
                            placeholder='Enter the date of your game'
                        />

                        <Input
                            name='time'
                            type='text'
                            label='Time'
                            placeholder='Enter the time of your game'
                        />

                        <div className='buttons'>
                            <button className="submit" type='submit'>Save</button>
                            <button className="cancel" type='button' onClick={() => { setHosting(false) }}>Cancel</button>
                        </div>
                    </form>
                </div>}
                <div className='tab-headers-container'>
                    <span className={`tab-header${tab === "Upcoming games" ? "-selected" : ""}`} onClick={() => { setTab('Upcoming games') }}>Upcoming games</span>
                    <span className={`tab-header${tab === "Past games" ? "-selected" : ""}`} onClick={() => { setTab('Past games') }}>Past games</span>
                </div>
                {tab === 'Upcoming games' && <Table headers={headers} data={tableData} shadow />}
                {tab === 'Past games' && <Table headers={headers} data={tableData} shadow />}
            </div>
        </div>
    );
}
