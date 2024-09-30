// src/pages/Dashboard/Games/Games.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Games.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Table from '../../../components/Table/Table';

export function Games() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('games');
    const [tab, setTab] = useState('Upcoming Games');
    const [games, setGames] = useState([]);
    const [invitations, setInvitations] = useState([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedUser = JSON.parse(localStorage.getItem('user'));
                if (loggedUser && loggedUser._id === userId) {
                    const res = await axios.get(`http://localhost:3001/users/${userId}`);
                    setUser(res.data);
                } else {
                    navigate('/signin');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                navigate('/signin');
            }
        };
        fetchUser();
    }, [userId, navigate]);

    useEffect(() => {
        if (user) {
            fetchGames();
        }
    }, [tab, user]);

    const fetchGames = async () => {
        try {
            if (tab === 'Upcoming Games' || tab === 'Past Games') {
                const status = tab === 'Upcoming Games' ? 'upcoming' : 'completed';
                const res = await axios.get(`http://localhost:3001/games/player/${user._id}`, {
                    params: { status }
                });
                setGames(res.data);
            } else if (tab === 'Invitations') {
                const res = await axios.get(`http://localhost:3001/players/invitations/${user._id}`);
                setInvitations(res.data);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    const handleAcceptInvitation = async (gameId) => {
        try {
            await axios.post(`http://localhost:3001/players/accept-invitation`, {
                userId: user._id,
                gameId: gameId
            });
            fetchGames();
        } catch (error) {
            console.error('Error accepting invitation:', error);
        }
    };

    const handleDeclineInvitation = async (gameId) => {
        const confirmDecline = window.confirm("Are you sure you want to decline this invitation?");
        if (!confirmDecline) return;

        try {
            await axios.post(`http://localhost:3001/players/decline-invitation`, {
                userId: user._id,
                gameId: gameId
            });
            fetchGames();
        } catch (error) {
            console.error('Error declining invitation:', error);
        }
    };

    const handleRowClick = (gameId) => {
        if (tab === 'Invitations') {
            // Do nothing; prevent viewing game details before accepting
            return;
        }
        navigate(`/dashboard/${user._id}/games/game/${gameId}`);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    const headers = ["Name", "Host", "Location", "Date/Time", "Blinds"];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />
            <div className='logged-content-container'>
                <div className='dashboard-heading'><h1>Games</h1></div>
                <div className='tab-container'>
                    <button
                        className={`tab${tab === "Upcoming Games" ? "-selected" : ""}`}
                        onClick={() => { setTab('Upcoming Games') }}
                    >
                        Upcoming Games
                    </button>
                    <button
                        className={`tab${tab === "Past Games" ? "-selected" : ""}`}
                        onClick={() => { setTab('Past Games') }}
                    >
                        Past Games
                    </button>
                    <button
                        className={`tab${tab === "Invitations" ? "-selected" : ""}`}
                        onClick={() => { setTab('Invitations') }}
                    >
                        Invitations
                    </button>
                </div>
                {tab === 'Invitations' ? (
                    invitations.length > 0 ? (
                        <table className="invitations-table">
                            <thead>
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations
                                    .filter(invitation => invitation != null && invitation.host_id != null)
                                    .map((invitation, rowIndex) => (
                                        <tr key={rowIndex}>
                                            <td>{invitation.game_name}</td>
                                            <td>{invitation.host_id.username}</td>
                                            <td>{invitation.location}</td>
                                            <td>{new Date(invitation.game_date).toLocaleString()}</td>
                                            <td>{invitation.blinds}</td>
                                            <td>
                                                <button
                                                    className="accept-button"
                                                    onClick={() => handleAcceptInvitation(invitation._id)}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="decline-button"
                                                    onClick={() => handleDeclineInvitation(invitation._id)}
                                                >
                                                    Decline
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-games-message">
                            You currently have no game invitations.
                        </div>
                    )
                ) : (
                    games.length > 0 ? (
                        <Table
                            headers={headers}
                            data={games.map(game => ({
                                'name': game.game_name,
                                'host': game.host_id.username,
                                'location': game.location,
                                'date/time': new Date(game.game_date).toLocaleString(),
                                'blinds': game.blinds,
                                '_id': game._id
                            }))}
                            onRowClick={handleRowClick}
                            shadow
                        />
                    ) : (
                        <div className="no-games-message">
                            You currently have no {tab.toLowerCase()}.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default Games;
