import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Host.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Table from '../../../components/Table/Table';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';

export function Host() {
    const [user, setUser] = useState(null);
    const { userId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState('host');
    const [hosting, setHosting] = useState(false);
    const [tab, setTab] = useState('Upcoming games');
    const [games, setGames] = useState([]);
    const initialGameFormState = {
        name: '',
        blinds: '',
        location: '',
        date: '',
        time: '',
        handed: '',
        isPublic: false, // New field for public/private games
    };
    const [gameForm, setGameForm] = useState(initialGameFormState);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    // Wrap fetchGames with useCallback so its dependencies are explicit
    const fetchGames = useCallback(async () => {
        if (!user) return;
        try {
            const status = tab === 'Upcoming games' ? 'upcoming' : 'completed';
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/games`, {
                params: { status, host_id: user._id }
            });
            setGames(res.data);
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    }, [tab, user]);

    // Call fetchGames whenever the user or tab changes
    useEffect(() => {
        if (user) {
            fetchGames();
        }
    }, [user, fetchGames]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGameForm({ ...gameForm, [name]: value });
    };

    // In Host.js, modify the handleSubmit function
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const gameDateTimeString = `${gameForm.date}T${gameForm.time}:00`;
            const gameDateTime = new Date(gameDateTimeString);

            const newGame = {
                host_id: user._id,
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: gameDateTime,
                game_status: 'upcoming',
                blinds: gameForm.blinds,
                handed: gameForm.handed,
                is_public: gameForm.isPublic // Added isPublic field
            };

            console.log("Submitting game with data:", newGame); // Add this line

            await axios.post(`${process.env.REACT_APP_API_URL}/games`, newGame);
            setHosting(false);
            setGameForm(initialGameFormState);
            fetchGames();
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    const handleCancel = () => {
        setHosting(false);
        setGameForm(initialGameFormState);
    };

    const handleRowClick = (gameId) => {
        navigate(`/dashboard/${user._id}/host/game/${gameId}`);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Notifications', page: 'notifications' }, // New menu item
        { title: 'Bankroll', page: 'bankroll' }
    ];

    const headers = ["Name", "Host", "Location", "Date", "Time", "Blinds"];

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />
            <div className='logged-content-container'>
                <div className='dashboard-heading'><h1>Host</h1></div>
                {!hosting && (
                    <button className="host-button" onClick={() => setHosting(true)}>
                        + Host a new game
                    </button>
                )}
                {hosting && (
                    <div className='host-form-container'>
                        <form className='host-form' onSubmit={handleSubmit}>
                            <Input
                                name='name'
                                type='text'
                                label='Name'
                                placeholder={`Give your game a name e.g.${user.username}'s poker night`}
                                value={gameForm.name}
                                onChange={handleInputChange}
                            />
                            <div className='input-double'>
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
                                <Select
                                    name="handed"
                                    label="Handed"
                                    placeholder="Select the player max"
                                    value={gameForm.handed}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '2', label: '2 max' },
                                        { value: '3', label: '3 max' },
                                        { value: '4', label: '4 max' },
                                        { value: '5', label: '5 max' },
                                        { value: '6', label: '6 max' },
                                        { value: '7', label: '7 max' },
                                        { value: '8', label: '8 max' },
                                        { value: '9', label: '9 max' },
                                        { value: '10', label: '10 max' },
                                    ]}
                                />
                            </div>

                            <div className="game-privacy-option">
                                <label className="input-label">Game Privacy</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="isPublic"
                                            checked={!gameForm.isPublic}
                                            onChange={() => {
                                                console.log("Setting isPublic to false");
                                                setGameForm({ ...gameForm, isPublic: false });
                                            }}
                                        />
                                        Private (invite only)
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="isPublic"
                                            checked={gameForm.isPublic}
                                            onChange={() => {
                                                console.log("Setting isPublic to true");
                                                setGameForm({ ...gameForm, isPublic: true });
                                            }}
                                        />
                                        Public (open to join requests)
                                    </label>
                                </div>
                            </div>

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
                            <div className='buttons'>
                                <button className="submit" type='submit'>Save</button>
                                <button className="cancel" type='button' onClick={handleCancel}>Cancel</button>
                            </div>
                        </form >
                    </div >
                )
                }
                <div className='tab-container'>
                    <button
                        className={`tab${tab === "Upcoming games" ? "-selected" : ""}`}
                        onClick={() => { setTab('Upcoming games') }}
                    >
                        Upcoming games
                    </button>
                    <button
                        className={`tab${tab === "Past games" ? "-selected" : ""}`}
                        onClick={() => { setTab('Past games') }}
                    >
                        Past games
                    </button>
                </div>
                {
                    games.length > 0 ? (
                        <Table
                            headers={headers}
                            data={games.map(game => {
                                const gameDate = new Date(game.game_date);
                                const formattedDate = gameDate.toLocaleDateString();
                                const formattedTime = gameDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                return {
                                    'name': game.game_name,
                                    'host': game.host_id.username,
                                    'location': game.location,
                                    'date': formattedDate,
                                    'time': formattedTime,
                                    'blinds': game.blinds,
                                    '_id': game._id
                                };
                            })}
                            onRowClick={handleRowClick}
                            shadow
                        />
                    ) : (
                        <div className="no-games-message">
                            You currently have no {tab.toLowerCase()}
                        </div>
                    )
                }
            </div >
        </div >
    );
}

export default Host;
