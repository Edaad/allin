// src/pages/Dashboard/Games/Games.js

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Games.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Table from '../../../components/Table/Table';
import Filter from '../../../components/Filter/Filter';
import GameCard from '../../../components/GameCard/GameCard';

export function Games() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('games');
    const [tab, setTab] = useState('Public Games');
    const [games, setGames] = useState([]);
    const [requestedGames, setRequestedGames] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [isRequesting, setIsRequesting] = useState(false);
    const [filterParams, setFilterParams] = useState({});

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

    // Wrap fetchGames in useCallback so that its identity is stable
    const fetchGames = useCallback(async () => {
        if (!user) return;
        try {
            if (tab === 'Upcoming Games' || tab === 'Past Games') {
                const status = tab === 'Upcoming Games' ? 'upcoming' : 'completed';
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/games/player/${user._id}`, {
                    params: { status }
                });
                setGames(res.data);
            } else if (tab === 'Public Games') {
                const params = {
                    status: 'upcoming',
                    is_public: true,
                    userId: user._id,
                    ...filterParams
                };
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/games`, { params });
                setGames(res.data);
            } else if (tab === 'Invitations') {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/players/invitations/${user._id}`);
                setInvitations(res.data);
            } else if (tab === 'Requested Games') {
                // Fetch games where the user has requested to join or was rejected
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/requested/${user._id}`);
                setRequestedGames(res.data);
            }
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }, [tab, user, filterParams]);

    // Apply filters when they change in Public Games tab
    useEffect(() => {
        if (tab === 'Public Games') {
            fetchGames();
        }
    }, [filterParams, tab, fetchGames]);

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

            // Update the local games state to reflect the status change
            setGames(prevGames =>
                prevGames.map(game =>
                    game._id === gameId
                        ? { ...game, playerStatus: 'requested' }
                        : game
                )
            );

            setIsRequesting(false);
        } catch (error) {
            console.error('Error requesting to join game:', error);
            setIsRequesting(false);
        }
    };

    // Render function for status column in game tables
    // Render function for status column in game tables
    const renderGameStatus = (game) => {
        if (game.playerStatus === 'none' && game.is_public) {
            return (
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
            );
        } else if (game.playerStatus === 'requested') {
            return <span className="status-tag requested">Pending</span>;
        } else if (game.playerStatus === 'accepted') {
            return <span className="status-tag accepted">Joined</span>;
        } else if (game.playerStatus === 'pending') {
            return <span className="status-tag pending">Invitation Pending</span>;
        } else if (game.playerStatus === 'rejected') {
            return <span className="status-tag rejected">Rejected</span>;
        }
        return null;
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
            <div className="logged-content-container">
                <div className="dashboard-heading"><h1>Games</h1></div>
                <div className="tab-container">
                    <button className={`tab${tab === "Public Games" ? "-selected" : ""}`} onClick={() => { setTab('Public Games') }}>
                        Public Games
                    </button>
                    <button className={`tab${tab === "Requested Games" ? "-selected" : ""}`} onClick={() => { setTab('Requested Games') }}>
                        Requested Games
                    </button>
                    <button className={`tab${tab === "Invitations" ? "-selected" : ""}`} onClick={() => { setTab('Invitations') }}>
                        Invitations
                    </button>
                    <button className={`tab${tab === "Upcoming Games" ? "-selected" : ""}`} onClick={() => { setTab('Upcoming Games') }}>
                        Upcoming Games
                    </button>
                    <button className={`tab${tab === "Past Games" ? "-selected" : ""}`} onClick={() => { setTab('Past Games') }}>
                        Past Games
                    </button>
                </div>

                {tab === 'Public Games' ? (
                    <div className="public-games-container" style={{ display: 'flex' }}>
                        <Filter tab={tab} onApply={(filters) => setFilterParams(filters)} />
                        <div className="games-table" style={{ flex: 1 }}>
                            {games.length > 0 ? (
                                <Table
                                    headers={headers}
                                    data={games.map((game) => {
                                        const gameDate = new Date(game.game_date);
                                        return {
                                            'name': game.game_name,
                                            'host': game.host_id.username,
                                            'location': game.location,
                                            'date': gameDate.toLocaleDateString(),
                                            'time': gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            'blinds': game.blinds,
                                            '_id': game._id,
                                            'is_public': game.is_public,
                                            'playerStatus': game.playerStatus || 'none',
                                            'clickable': game.playerStatus === 'accepted'
                                        };
                                    })}
                                    onRowClick={handleRowClick}
                                    renderStatus={renderGameStatus}
                                    shadow
                                />
                            ) : (
                                <div className="no-games-message">There are no public games available.</div>
                            )}
                        </div>
                    </div>
                ) : tab === 'Invitations' ? (
                    invitations.length > 0 ? (
                        <table className="table-container">
                            <thead>
                                <tr>
                                    {invitationHeaders.map((header, index) => (
                                        <th key={index}>{header}</th>
                                    ))}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.filter(inv => inv != null && inv.host_id != null).map((inv, rowIndex) => {
                                    const gameDate = new Date(inv.game_date);
                                    return (
                                        <tr key={rowIndex}>
                                            <td>{inv.game_name}</td>
                                            <td>{inv.host_id.username}</td>
                                            <td>{gameDate.toLocaleDateString()}</td>
                                            <td>{gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{inv.blinds}</td>
                                            <td className="ad-buttons-container">
                                                <button className="accept-button small" onClick={() => handleAcceptInvitation(inv._id)}>
                                                    Accept
                                                </button>
                                                <button className="decline-button small" onClick={() => handleDeclineInvitation(inv._id)}>
                                                    Decline
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-games-message">You currently have no game invitations.</div>
                    )
                ) : tab === 'Requested Games' ? (
                    // New Requested Games tab content with GameCard components
                    <div className="requested-games-container">
                        {requestedGames.length > 0 ? (
                            <div className="game-cards-grid">
                                {requestedGames.map(game => (
                                    <GameCard
                                        key={game._id}
                                        game={game}
                                        user={user}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="no-games-message">
                                You haven't requested to join any games yet.
                            </div>
                        )}
                    </div>
                ) : (
                    games.length > 0 ? (
                        <Table
                            headers={headers}
                            data={games.map((game) => {
                                const gameDate = new Date(game.game_date);
                                return {
                                    'name': game.game_name,
                                    'host': game.host_id.username,
                                    'location': game.location,
                                    'date': gameDate.toLocaleDateString(),
                                    'time': gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    'blinds': game.blinds,
                                    '_id': game._id,
                                    'is_public': game.is_public,
                                    'playerStatus': game.playerStatus || 'none',
                                    'clickable': game.playerStatus === 'accepted'
                                };
                            })}
                            onRowClick={handleRowClick}
                            renderStatus={renderGameStatus}
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