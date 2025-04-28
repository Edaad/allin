import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderComp from '../../components/Header/Header';
import GameCard from '../../components/GameCard/GameCard';
import './Home.css';
import heroImage from '../../assets/images/hero_image.png';

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

                // Process each game to get player counts
                const processedGames = await Promise.all(
                    response.data.map(async (game) => {
                        try {
                            const playersRes = await axios.get(
                                `${process.env.REACT_APP_API_URL}/players/game/${game._id}`
                            );

                            const acceptedPlayers = playersRes.data.filter(
                                p => p.invitation_status === "accepted"
                            );

                            return {
                                ...game,
                                acceptedPlayersCount: acceptedPlayers.length,
                            };
                        } catch (err) {
                            console.error(`Error fetching players for game ${game._id}:`, err);
                            return game;
                        }
                    })
                );

                setPublicGames(processedGames);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching public games:', err);
                setError('Failed to load games');
                setLoading(false);
            }
        };

        fetchPublicGames();
    }, []);

    // Create custom action button that looks like the chip button
    const renderJoinButton = (game) => (
        <button
            className="chip-button"
            onClick={(e) => {
                e.stopPropagation();
                navigate('/signup');
            }}
        >
            <div className="chip-icon">
                <span className="request-text">Join</span>
            </div>
        </button>
    );

    return (
        <>
            <HeaderComp />
            <div className='home'>
                <div className='hero'>
                    <div className='hero-text'>
                        <p className='hero-main'>Play, Host, and Manage Poker Games</p>
                        <p className='hero-secondary'>
                            All-in-one platform for playing and hosting poker games.
                            Create your own games or join public ones.
                            Add friends and join groups to easily play with your crew.
                        </p>
                        <button className='cta' onClick={() => { navigate('/signup') }}>Get Started</button>
                    </div>
                    <img src={heroImage} alt='Friends playing poker' className='hero-img' />
                </div>

                <div className='public-games-section'>
                    <div className='section-header'>
                        <h2>Available Games</h2>
                        <p>Join a game as a guest or create an account to host your own.</p>
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
                                    user={null} // No user since this is the public home page
                                    customActions={renderJoinButton(game)}
                                    showBorder={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}