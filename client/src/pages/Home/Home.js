import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderComp from '../../components/Header/Header';
import GameCard from '../../components/GameCard/GameCard';
import './Home.css';

export function Home() {
    const navigate = useNavigate();
    const [publicGames, setPublicGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicGames = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/games`, {
                    params: {
                        is_public: true,
                        status: 'upcoming'
                    }
                });
                setPublicGames(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching public games:', err);
                setError('Failed to load games');
                setLoading(false);
            }
        };

        fetchPublicGames();
    }, []);

    return (
        <>
            <HeaderComp />
            <div className='home'>
                <div className='hero'>
                    <div className='hero-text'>
                        <h1 className='hero-main'>Make Poker Social Again 🤑</h1>
                        <p className='hero-secondary'>Manage your real-life poker games with ease. Designed by Team All In.</p>
                        <div className='hero-buttons'>
                            <button className='cta primary' onClick={() => navigate('/signup')}>Get Started</button>
                            <button className='cta secondary' onClick={() => navigate('/signin')}>Sign In</button>
                        </div>
                    </div>
                </div>

                <div className='public-games-section'>
                    <div className='section-header'>
                        <h2>Available Games</h2>
                        <p>Join a game as a guest or create an account to host your own</p>
                    </div>
                    
                    {loading ? (
                        <div className="loading-games">Loading available games...</div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : publicGames.length === 0 ? (
                        <div className="no-games-message">
                            <p>No public games available at the moment</p>
                            <button className='cta primary' onClick={() => navigate('/signup')}>Host a Game</button>
                        </div>
                    ) : (
                        <div className="games-grid">
                            {publicGames.map(game => (
                                <GameCard
                                    key={game._id}
                                    game={game}
                                    showJoinButton={true}
                                    onJoinClick={() => navigate(`/guest/join/${game._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
