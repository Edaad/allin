// src/pages/Dashboard/Games/Games.js

import React, { useEffect, useState, useCallback } from 'react';
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
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const loggedUser = JSON.parse(localStorage.getItem('user'));
                if (loggedUser && loggedUser._id === userId) {
                    const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${userId}`);
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

    // Wrap fetchGames in useCallback so that its identity is stable and dependencies are explicit.
    const fetchGames = useCallback(async () => {
        if (!user) return;
        try {
            if (tab === 'Upcoming Games' || tab === 'Past Games') {
                const status = tab === 'Upcoming Games' ? 'upcoming' : 'completed';
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/games/player/${user._id}`, {
                    params: { status }
                });
                setGames(res.data);
            } else if (tab === 'Invitations') {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/players/invitations/${user._id}`);
                setInvitations(res.data);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }, [tab, user]);

    useEffect(() => {
        if (user) {
            fetchGames();
        }
    }, [user, fetchGames]);

    const handleAcceptInvitation = async (gameId) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/players/accept-invitation`, {
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
            await axios.post(`${process.env.REACT_APP_API_URL}/players/decline-invitation`, {
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

    const handleRequestToJoin = async (gameId) => {
        try {
            setIsRequesting(true);
            await axios.post(`${process.env.REACT_APP_API_URL}/players/request-to-join`, {
                userId: user._id,
                gameId: gameId
            });
            fetchGames();
            setIsRequesting(false);
        } catch (error) {
            console.error('Error requesting to join game:', error);
            setIsRequesting(false);
        }
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    const headers = ["Name", "Host", "Location", "Date", "Time", "Blinds"];
    const invitationHeaders = ["Name", "Host", "Date", "Time", "Blinds"];

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
                        <Table className="table-container">
                            <thead>
                                <tr>
                                    {invitationHeaders.map((header, index) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations
                                    .filter(invitation => invitation != null && invitation.host_id != null)
                                    .map((invitation, rowIndex) => {
                                        const gameDate = new Date(invitation.game_date);
                                        const formattedDate = gameDate.toLocaleDateString();
                                        const formattedTime = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <tr key={rowIndex}>
                                                <td>{invitation.game_name}</td>
                                                <td>{invitation.host_id.username}</td>
                                                <td>{formattedDate}</td>
                                                <td>{formattedTime}</td>
                                                <td>{invitation.blinds}</td>
                                                <td className='ad-buttons-container'>
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
                                        );
                                    })}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="no-games-message">
                            You currently have no game invitations.
                        </div>
                    )
                ) : (
                    games.length > 0 ? (
                        <Table className="table-container">
                            <thead>
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {games.map((game, rowIndex) => {
                                    const gameDate = new Date(game.game_date);
                                    const formattedDate = gameDate.toLocaleDateString();
                                    const formattedTime = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                        <tr
                                            key={rowIndex}
                                            onClick={() => game.playerStatus === 'accepted' ? handleRowClick(game._id) : null}
                                            className={game.playerStatus === 'accepted' ? '' : 'row-disabled'}
                                        >
                                            <td>
                                                {game.game_name}
                                                {game.is_public && <span className="public-tag">Public</span>}
                                            </td>
                                            <td>{game.host_id.username}</td>
                                            <td>{game.location}</td>
                                            <td>{formattedDate}</td>
                                            <td>{formattedTime}</td>
                                            <td>{game.blinds}</td>
                                            <td>
                                                {game.playerStatus === 'none' && game.is_public && (
                                                    <button
                                                        className="request-button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRequestToJoin(game._id);
                                                        }}
                                                        disabled={isRequesting}
                                                    >
                                                        Request to Join
                                                    </button>
                                                )}
                                                {game.playerStatus === 'requested' && (
                                                    <span className="status-tag requested">Request Pending</span>
                                                )}
                                                {game.playerStatus === 'accepted' && (
                                                    <span className="status-tag accepted">Joined</span>
                                                )}
                                                {game.playerStatus === 'pending' && (
                                                    <span className="status-tag pending">Invitation Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
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
