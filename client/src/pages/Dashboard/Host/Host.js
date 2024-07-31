import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './Host.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Table from '../../../components/Table/Table';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';

export function Host() {
    const [user, setUser] = useState({ username: 'edaadpoker10' });
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
        time: ''
    };
    const [gameForm, setGameForm] = useState(initialGameFormState);

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin'); // Redirect to sign-in if no user data found or user ID does not match
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchGames();
    }, [tab]);

    const fetchGames = async () => {
        try {
            const status = tab === 'Upcoming games' ? 'upcoming' : 'completed';
            const res = await axios.get(`http://localhost:3001/games`, {
                params: { status }
            });
            setGames(res.data);
        } catch (error) {
            console.error('Error fetching games:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGameForm({ ...gameForm, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newGame = {
                host_id: userId,
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: `${gameForm.date}T${gameForm.time}:00`,
                game_status: 'upcoming',
                blinds: gameForm.blinds // Add blinds to the game details
            };
            await axios.post('http://localhost:3001/games', newGame);
            setHosting(false);
            setGameForm(initialGameFormState); // Reset form after successful submission
            fetchGames();
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    const handleCancel = () => {
        setHosting(false);
        setGameForm(initialGameFormState); // Reset form fields when cancel is clicked
    };

    const handleRowClick = (gameId) => {
        navigate(`/dashboard/${userId}/host/game/${gameId}`);
    };

    const menus = [
        { title: 'Overview', page: 'overview' },
        { title: 'Games', page: 'games' },
        { title: 'Host', page: 'host' },
        { title: 'Community', page: 'community' },
        { title: 'Bankroll', page: 'bankroll' }
    ];

    const headers = ["Name", "Host", "Location", "Date/Time", "Blinds"];

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={setPage} page={page} username={user.username} />}
            <div className='logged-content-container'>
                {user ? <div className='dashboard-heading'><h1>Host</h1></div> : <h1>Loading...</h1>}
                {hosting === false && <button className="host-button" onClick={() => setHosting(true)}>+ Host a new game</button>}
                {hosting === true && <div className='host-form-container'>
                    <form className='host-form' onSubmit={handleSubmit}>
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
                        <div className='buttons'>
                            <button className="submit" type='submit'>Save</button>
                            <button className="cancel" type='button' onClick={handleCancel}>Cancel</button>
                        </div>
                    </form>
                </div>}
                <div className='tab-container'>
                    <button className={`tab${tab === "Upcoming games" ? "-selected" : ""}`} onClick={() => { setTab('Upcoming games') }}>Upcoming games</button>
                    <button className={`tab${tab === "Past games" ? "-selected" : ""}`} onClick={() => { setTab('Past games') }}>Past games</button>
                </div>
                {tab === 'Upcoming games' && (
                    games.length > 0 ? (
                        <Table
                            headers={headers}
                            data={games.map(game => ({
                                'name': game.game_name,
                                'host': user.username,
                                'location': game.location,
                                'date/time': new Date(game.game_date).toLocaleString(),
                                'blinds': game.blinds,
                                '_id': game._id // Add game ID to the data
                            }))}
                            onRowClick={handleRowClick}
                            shadow
                        />
                    ) : (
                        <div className="no-games-message">You currently have no upcoming games</div>
                    )
                )}
                {tab === 'Past games' && (
                    games.length > 0 ? (
                        <Table
                            headers={headers}
                            data={games.map(game => ({
                                'name': game.game_name,
                                'host': user.username,
                                'location': game.location,
                                'date/time': new Date(game.game_date).toLocaleString(),
                                'blinds': game.blinds,
                                '_id': game._id // Add game ID to the data
                            }))}
                            onRowClick={handleRowClick}
                            shadow
                        />
                    ) : (
                        <div className="no-games-message">You currently have no past games</div>
                    )
                )}
            </div>
        </div>
    );
}
