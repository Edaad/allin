import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GuestProfileForm from '../../components/GuestProfileForm/GuestProfileForm';
import HeaderComp from '../../components/Header/Header';
import './GuestJoinPage.css';

export function GuestJoinPage() {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [game, setGame] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joinSuccess, setJoinSuccess] = useState(null);
    const [showAccountOption, setShowAccountOption] = useState(false);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                console.log('Fetching game with ID:', gameId);
                console.log('API URL:', process.env.REACT_APP_API_URL);
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/games/${gameId}`);
                console.log('Game data received:', response.data);
                
                if (!response.data.is_public) {
                    setError('This game is private and cannot be joined as a guest.');
                    setGame(null);
                } else {
                    setGame(response.data);
                    setError(null);
                }
            } catch (err) {
                console.error('Error fetching game:', err);
                setError('Game not found or no longer available.');
                setGame(null);
            } finally {
                setLoading(false);
            }
        };

        if (gameId) {
            fetchGame();
        } else {
            setError('Invalid game ID');
            setLoading(false);
        }
    }, [gameId]);

    const handleSuccess = (data) => {
        setJoinSuccess(data);
    };

    const handleError = (errorMessage) => {
        console.error("Error joining game:", errorMessage);
        setError(errorMessage);
        if (errorMessage.includes("duplicate key") || errorMessage.includes("already registered")) {
            setShowAccountOption(true);
        }
    };

    const handleSignupRedirect = () => {
        // Store the game ID in localStorage so we can join it after signup
        localStorage.setItem('pendingGameJoin', gameId);
        navigate('/signup');
    };

    // Return a more detailed loading state for debugging
    if (loading) {
        return (
            <>
                <HeaderComp />
                <div className="guest-join-container">
                    <div className="loading">
                        <p>Loading game data...</p>
                        <p>Game ID: {gameId}</p>
                    </div>
                </div>
            </>
        );
    }

    // Return a more detailed error state for debugging
    if (error) {
        return (
            <>
                <HeaderComp />
                <div className="guest-join-container">
                    <div className="error-message">
                        <h2>Error</h2>
                        <p>{error}</p>
                        {showAccountOption && (
                            <div className="account-option">
                                <p>It looks like you may have joined games before. Would you like to create an account instead?</p>
                                <div className="account-buttons">
                                    <button className="primary-button" onClick={handleSignupRedirect}>Create an account</button>
                                    <Link to="/signin" className="secondary-button">Sign in</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }

    // Return a more detailed state when no game is found
    if (!game) {
        return (
            <>
                <HeaderComp />
                <div className="guest-join-container">
                    <div className="error-message">
                        <h2>Game Not Found</h2>
                        <p>The requested game could not be found or is no longer available.</p>
                        <p>Game ID: {gameId}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <HeaderComp />
            <div className="guest-join-container">
                {joinSuccess ? (
                    <div className="success-container">
                        <div className="success-message">
                            <i className="fa-solid fa-circle-check"></i>
                            <h2>Successfully joined!</h2>
                            <p>{joinSuccess.message}</p>
                            {joinSuccess.status === 'waitlist' && (
                                <div className="waitlist-info">
                                    <p>You are currently #{joinSuccess.position} on the waitlist.</p>
                                    <p>We'll notify you when a spot becomes available.</p>
                                </div>
                            )}
                            {joinSuccess.status === 'requested' && (
                                <div className="request-info">
                                    <p>The host has been notified of your request to join.</p>
                                    <p>You'll receive a notification once your request is processed.</p>
                                </div>
                            )}
                            <div className="account-suggestion">
                                <p>Want to keep track of all your games?</p>
                                <button className="primary-button" onClick={handleSignupRedirect}>
                                    Create an account
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="guest-join-content">
                        <div className="game-info">
                            <h1>Join Game: {game.game_name}</h1>
                            <div className="game-details">
                                <div className="detail-item">
                                    <span className="detail-label">Date:</span>
                                    <span className="detail-value">
                                        <span className="icon-wrapper"><i className="fa-solid fa-calendar"></i></span>
                                        {new Date(game.game_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Time:</span>
                                    <span className="detail-value">
                                        <span className="icon-wrapper"><i className="fa-solid fa-clock"></i></span>
                                        {new Date(game.game_date).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Location:</span>
                                    <span className="detail-value">
                                        <span className="icon-wrapper"><i className="fa-solid fa-location-dot"></i></span>
                                        {game.location}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Blinds:</span>
                                    <span className="detail-value">
                                        <span className="icon-wrapper"><i className="fa-solid fa-dollar-sign"></i></span>
                                        ${game.blinds.split('/')[0]}/${game.blinds.split('/')[1]}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Max Players:</span>
                                    <span className="detail-value">
                                        <span className="icon-wrapper"><i className="fa-solid fa-users"></i></span>
                                        {game.handed}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="join-options">
                            <div className="join-option-tabs">
                                <button className="tab active">Join as Guest</button>
                                <Link to="/signup" className="tab">Create Account</Link>
                                <Link to="/signin" className="tab">Sign In</Link>
                            </div>
                            
                            <GuestProfileForm 
                                gameId={gameId} 
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                            
                            <div className="account-benefits">
                                <h3>Benefits of creating an account:</h3>
                                <ul>
                                    <li>Track all your games in one place</li>
                                    <li>Get notifications about upcoming games</li>
                                    <li>Join communities with other players</li>
                                    <li>Track your bankroll and performance</li>
                                </ul>
                                <button className="secondary-button" onClick={handleSignupRedirect}>
                                    Create an account instead
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}