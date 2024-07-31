import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../Dashboard.css';
import './GameDashboard.css';
import Sidebar from '../../../components/Sidebar/Sidebar';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';

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

    useEffect(() => {
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        if (loggedUser && loggedUser._id === userId) {
            setUser(loggedUser);
        } else {
            navigate('/signin');
        }
    }, [userId, navigate]);

    useEffect(() => {
        fetchGame();
    }, [gameId]);

    const fetchGame = async () => {
        try {
            const res = await axios.get(`http://localhost:3001/games/${gameId}`);
            const gameData = res.data;
            setGame(gameData);
            setGameForm({
                name: gameData.game_name,
                blinds: gameData.blinds,
                location: gameData.location,
                date: gameData.game_date.split('T')[0],
                time: gameData.game_date.split('T')[1].slice(0, 5)
            });
        } catch (error) {
            console.error('Error fetching game:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setGameForm({ ...gameForm, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const updatedGame = {
                game_name: gameForm.name,
                location: gameForm.location,
                game_date: `${gameForm.date}T${gameForm.time}:00`,
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

    if (!game) {
        return <div>Loading...</div>;
    }

    return (
        <div className="dashboard">
            {user && <Sidebar menus={menus} setPage={() => { }} page="host" username={user.username} />}
            <div className='logged-content-container'>
                <div className='dashboard-heading'><h1>{game.game_name}</h1></div>
                {editing ? (
                    <div className='host-form-container'>
                        <form className='host-form' onSubmit={handleUpdate}>
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
                                <button className="cancel" type='button' onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>) : (
                    <div className='game-details'>
                        <div><strong>Name:</strong> {game.game_name}</div>
                        <div><strong>Blinds:</strong> {game.blinds}</div>
                        <div><strong>Location:</strong> {game.location}</div>
                        <div><strong>Date/Time:</strong> {new Date(game.game_date).toLocaleString()}</div>
                        <div className='buttons'>
                            <button className="edit" onClick={() => setEditing(true)}>Edit</button>
                            <button className="delete" onClick={handleDelete}>Delete</button>
                            <button className="back" onClick={() => navigate(-1)}>Back</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
