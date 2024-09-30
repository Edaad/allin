// GameDashboard.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './GameDashboard.css';
import '../Host/Host.css'; // Import Host.css to apply the styles
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
                    // Fetch user data with friends populated
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
        e.preventDefault(); // Prevent the default form submission behavior
        try {
            // Combine date and time into a single string
            const gameDateTimeString = `${gameForm.date}T${gameForm.time}:00`;

            // Create a Date object from the string
            const gameDateTime = new Date(gameDateTimeString);

            // Prepare the updated game object
            const updatedGame = {
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: gameDateTime, // Send the Date object directly
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
        try {
            await axios.delete(`http://localhost:3001/games/${gameId}`);
            navigate(`/dashboard/${userId}/host`);
        } catch (error) {
            console.error('Error deleting game:', error);
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
                                <button className="save" onClick={handleUpdate}>Save</button>
                                <button className="cancel" onClick={() => setEditing(false)}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <button className="edit" onClick={() => setEditing(true)}>Edit</button>
                                <button className="delete" onClick={handleDelete}>Delete</button>
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
                                <div><strong>Name:</strong> {game.game_name}</div>
                                <div><strong>Blinds:</strong> {game.blinds}</div>
                                <div><strong>Location:</strong> {game.location}</div>
                                <div><strong>Date/Time:</strong> {new Date(game.game_date).toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                    <div className='summary-item players-item'>
                        <div className='summary-header'>
                            <h2>Players</h2>
                        </div>
                        {editing ? (
                            <InvitePlayers
                                user={user}
                                gameId={gameId}
                                players={players}
                                fetchPlayers={fetchPlayers}
                            />
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
