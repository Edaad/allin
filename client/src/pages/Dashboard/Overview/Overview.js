// Overview.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Overview.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Table from '../../../components/Table/Table';
import Profile from '../../../components/Profile/Profile';
import GameCard from '../../../components/GameCard/GameCard';

export function Overview() {
    const [user, setUser] = useState(null);
    const { userId, menuItem } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(menuItem || 'overview');
    const [friends, setFriends] = useState([]);
    const [userGames, setUserGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    useEffect(() => {
        setPage(menuItem || 'overview');
    }, [menuItem]);

    // Fetch user data including friends
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`);
                const fetchedUser = res.data;
                setUser(fetchedUser);
                setFriends(fetchedUser.friends); // Set friends from fetched data
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/signin'); // Redirect if fetching user data fails
            }
        };

        fetchUserData();
    }, [userId, navigate]);

    // Fetch user's games
    useEffect(() => {
        const fetchUserGames = async () => {
            if (!user) return;

            setIsLoading(true);
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/games/player/${userId}`);
                // Get the most recent 3 games for the overview page
                setUserGames(res.data.slice(0, 3));
            } catch (error) {
                console.error('Error fetching user games:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserGames();
    }, [userId, user]);

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' },
    ];

    const headers = ['Name', 'Host', 'Location', 'Date', 'Seats'];
    const tableData = [
        { name: 'Game 1', host: 'Alice', location: 'NYC', date: '2022-01-01', seats: 5, _id: 1 },
        { name: 'Game 2', host: 'Bob', location: 'LA', date: '2022-02-01', seats: 3, _id: 2 },
    ];

    return (
        <div className="dashboard">
            {user && (
                <Sidebar menus={menus} page={page} username={user.username} userId={user._id} />
            )}
            <div className="logged-content-container">
                {user ? (
                    <div className="dashboard-heading">
                        <h1>Hi</h1> <h1>{user.names.firstName} {user.names.lastName}</h1>
                    </div>
                ) : (
                    <h1>Loading...</h1>
                )}
                <div className="overview-container">
                    <div className="summary-item">
                        <div className="summary-header">
                            <h2>Summary</h2>
                            <div className="summary-header-divider"></div>
                            <div
                                className="summary-link"
                                onClick={() => navigate(`/dashboard/${userId}/bankroll`)}
                            >
                                Bankroll
                            </div>
                        </div>
                        <div className="net-bankroll-amount">+$457</div>
                        <Table headers={headers} data={tableData} compact />
                    </div>
                    <div className="summary-secondary">
                        <div className="summary-item">
                            <div className="summary-header">
                                <h2>Upcoming Games</h2>
                                <div className="summary-header-divider"></div>
                                <div
                                    className="summary-link"
                                    onClick={() => navigate(`/dashboard/${userId}/games`)}
                                >
                                    View All
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="loading-games">Loading your games...</div>
                            ) : (
                                <div className="overview-game-cards">
                                    {userGames.length > 0 ? (
                                        userGames.map(game => (
                                            <GameCard
                                                key={game._id}
                                                game={game}
                                                user={user}
                                            />
                                        ))
                                    ) : (
                                        <p>You don't have any upcoming games.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="summary-item">
                            <div className="summary-header">
                                <h2>Friends</h2>
                                <div className="summary-header-divider"></div>
                                <div
                                    className="summary-link"
                                    onClick={() => navigate(`/dashboard/${userId}/community`)}
                                >
                                    Community
                                </div>
                            </div>
                            <div className="all-profiles-container">
                                {friends.length > 0 ? (
                                    friends.map((friend) => (
                                        <Profile key={friend._id} data={friend} size="compact" />
                                    ))
                                ) : (
                                    <p>You have no friends yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Overview;