import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HeaderComp from '../../components/Header/Header';
import './Home.css';

// Create a simplified version of GameCard for the home page
const HomeGameCard = ({ game, onJoinClick }) => {
    // Format date to be more readable
    const formatDate = (dateString) => {
        const options = {
            month: "long",
            day: "numeric",
            year: "numeric",
        };
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", options);
    };

    // Format time to 12 hour format
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <div className="poker-game-card">
            <div className="game-card-header">
                <div className="game-title-section">
                    <div className="game-icon"></div>
                    <h3 className="game-title">{game.game_name}</h3>
                    <span className="host-label">
                        <span className="gameCard-circle-divider">|</span>
                        {game.host_id?.username || "Anonymous Host"}
                    </span>
                </div>
                {game.game_status && (
                    <div className={`game-status-indicator ${game.game_status}`}>
                        {game.game_status.charAt(0).toUpperCase() + game.game_status.slice(1)}
                    </div>
                )}
            </div>

            <hr className="divider" />

            <div className="card-content-wrapper">
                <div className="gameCard-details">
                    <div className="detail-row">
                        <span className="card-detail-label">Date:</span>
                        <span className="detail-value">{formatDate(game.game_date)}</span>
                    </div>

                    <div className="detail-row">
                        <span className="card-detail-label">Time:</span>
                        <span className="detail-value">{formatTime(game.game_date)}</span>
                    </div>

                    <div className="detail-row">
                        <span className="card-detail-label">Location:</span>
                        <span className="detail-value">{game.location}</span>
                    </div>

                    <div className="detail-row">
                        <span className="card-detail-label">Blinds:</span>
                        <span className="detail-value">{game.blinds}</span>
                    </div>

                    <div className="detail-row">
                        <span className="card-detail-label">Open Seats:</span>
                        <span className="detail-value">
                            {game.acceptedPlayersCount
                                ? `${game.handed - game.acceptedPlayersCount}/${game.handed}`
                                : `${game.handed - 1}/${game.handed}`}
                        </span>
                    </div>
                </div>

                <div className="game-actions">
                    <button className="join-button" onClick={onJoinClick}>
                        Join Game
                    </button>
                </div>
            </div>
        </div>
    );
};

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

    // Handle join game click
    const handleJoinClick = () => {
        navigate('/signup');
    };

    return (
        <>
            <HeaderComp />
            <div className='home'>
                <div className='hero'>
                    <div className='hero-text'>
                        <h1 className='hero-main'>Time to go allin.</h1>
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
                                <HomeGameCard
                                    key={game._id}
                                    game={game}
                                    onJoinClick={handleJoinClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}