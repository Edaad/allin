// GameDashboard.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './GameDashboard.css';
import '../Host/Host.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import InvitePlayers from '../../../components/InvitePlayers/InvitePlayers';
import Profile from '../../../components/Profile/Profile';

export function GameDashboard() {
    const [user, setUser] = useState(null);
    const { userId, gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [editing, setEditing] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [isPlayer, setIsPlayer] = useState(false);
    const [gameForm, setGameForm] = useState({
        name: '',
        blinds: '',
        location: '',
        date: '',
        time: ''
    });
    const [players, setPlayers] = useState([]);

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
        fetchGame();

    }, [gameId]);

    const fetchGame = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/games/${gameId}`);
            const gameData = res.data;
            setGame(gameData);

            // Parse the game_date into a Date object
            const gameDate = new Date(gameData.game_date);

            // Extract date components
            const year = gameDate.getFullYear();
            const month = String(gameDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
            const day = String(gameDate.getDate()).padStart(2, '0');

            // Extract time components
            const hours = String(gameDate.getHours()).padStart(2, '0');
            const minutes = String(gameDate.getMinutes()).padStart(2, '0');

            // Format date and time
            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hours}:${minutes}`;

            setGameForm({
                name: gameData.game_name,
                blinds: gameData.blinds,
                location: gameData.location,
                date: formattedDate,
                time: formattedTime
            });
            fetchPlayers();
        } catch (error) {
            console.error('Error fetching game:', error);
        }
    };
    useEffect(() => {
        if (user && game) {
            setIsHost(user._id === game.host_id._id);
            const isUserPlayer = players.some(
                (player) =>
                    player.user_id._id === user._id &&
                    player.invitation_status === 'accepted'
            );
            setIsPlayer(isUserPlayer);
        }
    }, [user, game, players]);

    const fetchPlayers = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/players/game/${gameId}`);
            setPlayers(res.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGameForm({ ...gameForm, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const gameDateTimeString = `${gameForm.date}T${gameForm.time}:00`;
            const gameDateTime = new Date(gameDateTimeString);

            const updatedGame = {
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: gameDateTime,
                blinds: gameForm.blinds
            };

            await axios.put(`http://localhost:3001/games/${gameId}`, updatedGame);
            setEditing(false);
            fetchGame();
        } catch (error) {
            console.error('Error updating game:', error);
        }
    };

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Are you sure you want to delete this game?");
        if (!confirmDelete) return;
        try {
            await axios.delete(`http://localhost:3001/games/${gameId}`);
            navigate(`/dashboard/${userId}/host`);
        } catch (error) {
            console.error('Error deleting game:', error);
        }
    };

    const handleEdit = () => {
        if (isHost) {
            setEditing(true);
        } else {
            alert("Only the host can edit this game.");
        }
    };

    const handleLeaveGame = async () => {
        const confirmLeave = window.confirm("Are you sure you want to leave this game?");
        if (!confirmLeave) return;

        try {
            const data = {
                gameId: gameId,
                inviterId: user._id,
                inviteeId: user._id,
            };
            await axios.post('http://localhost:3001/players/remove-player', data);
            navigate(`/dashboard/${userId}/games`);
        } catch (error) {
            console.error('Error leaving game:', error);
        }
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    if (!game || !user) {
        return <div>Loading...</div>;
    }


    const gameDate = new Date(game.game_date);
    const formattedDate = gameDate.toLocaleDateString();
    const formattedTime = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Separate players into accepted and pending
    const acceptedPlayers = players.filter(player => player.invitation_status === 'accepted');
    const pendingPlayers = players.filter(player => player.invitation_status === 'pending');

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={() => { }} page="host" username={user.username} />
            <div className='logged-content-container game-dashboard'>
                <div className='dashboard-heading'>
                    <h1>{game.game_name}</h1>
                    <div className='buttons'>
                        {editing ? (
                            <>
                                {isHost && <button className="save" onClick={handleUpdate}>Save</button>}
                                {isHost && <button className="cancel" onClick={() => setEditing(false)}>Cancel</button>}
                            </>
                        ) : (
                            <>
                                {isHost && <button className="edit" onClick={handleEdit}>Edit</button>}
                                {isHost && <button className="delete" onClick={handleDelete}>Delete</button>}
                                {!isHost && isPlayer && (
                                    <button className="leave-game" onClick={handleLeaveGame}>Leave Game</button>
                                )}
                                <button className="back" onClick={() => navigate(-1)}>Back</button>
                            </>
                        )}
                    </div>
                </div>
                <div className='game-dashboard-container'>
                    <div className='summary-item'>
                        <div className='summary-header'>
                            <h2>Details</h2>
                        </div>
                        {editing ? (
                            <form className='host-form compact'>
                                <Input
                                    name='name'
                                    type='text'
                                    label='Name'
                                    placeholder={`Give your game a name e.g ${user.username}'s poker night`}
                                    value={gameForm.name}
                                    onChange={handleInputChange}
                                />
                                <Select
                                    name="blinds"
                                    label="Blinds"
                                    placeholder="Select your game blinds"
                                    value={gameForm.blinds}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '1/2', label: '$1/$2' },
                                        { value: '2/5', label: '$2/$5' },
                                        { value: '5/10', label: '$5/$10' },
                                    ]}
                                />
                                <Input
                                    name='location'
                                    type='text'
                                    label='Location'
                                    placeholder='Enter the address of your game'
                                    value={gameForm.location}
                                    onChange={handleInputChange}
                                />
                                <div className='input-double'>
                                    <Input
                                        name='date'
                                        type='date'
                                        label='Date'
                                        value={gameForm.date}
                                        onChange={handleInputChange}
                                    />
                                    <Input
                                        name='time'
                                        type='time'
                                        label='Time'
                                        value={gameForm.time}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                {/* Buttons are now at the top right, so we don't include them here */}
                            </form>
                        ) : (
                            <div className='game-details'>
                                <div className='detail-item'>
                                    <span className='detail-label'>Blinds: </span>
                                    <span className='detail-value'>{game.blinds}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Location: </span>
                                    <span className='detail-value'>{game.location}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Date: </span>
                                    <span className='detail-value'>{formattedDate}</span>
                                </div>
                                <div className='detail-item'>
                                    <span className='detail-label'>Time: </span>
                                    <span className='detail-value'>{formattedTime}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className='summary-item players-item'>
                        <div className='summary-header'>
                            <h2>Players</h2>
                        </div>
                        {editing ? (
                            isHost ? (
                                <InvitePlayers
                                    user={user}
                                    gameId={gameId}
                                    players={players}
                                    fetchPlayers={fetchPlayers}
                                />
                            ) : (
                                <div>You are not authorized to edit players.</div>
                            )
                        ) : (
                            <div className='players-list'>
                                {acceptedPlayers.length > 0 ? (
                                    <>
                                        <h3>Players</h3>
                                        <div className='all-profiles-container'>
                                            {acceptedPlayers.map(player => (
                                                <Profile key={player._id} data={player.user_id} size={"compact"} />
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div>No accepted players</div>
                                )}
                                {pendingPlayers.length > 0 && (
                                    <>
                                        <h3>Pending Invitations</h3>
                                        <div className='all-profiles-container'>
                                            {pendingPlayers.map(player => (
                                                <Profile key={player._id} data={player.user_id} size={"compact"} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GameDashboard;
