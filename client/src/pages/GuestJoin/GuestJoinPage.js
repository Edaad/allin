import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import GuestProfileForm from '../../components/GuestProfileForm/GuestProfileForm';
import HeaderComp from '../../components/Header/Header';
import './GuestJoinPage.css';

export function GuestJoinPage() {
    const { gameId } = useParams();
    const [game, setGame] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/games/${gameId}`);
                if (!response.data.is_public) {
                    setError('This game is private and cannot be joined as a guest.');
                    setGame(null);
                } else {
                    setGame(response.data);
                    setError(null);
                }
            } catch (err) {
                setError('Game not found or no longer available.');
                setGame(null);
            } finally {
                setLoading(false);
            }
        };

        fetchGame();
    }, [gameId]);

    return (
        <>
            <HeaderComp />
            <div className="guest-join-container">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
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
                        <GuestProfileForm gameId={gameId} />
                    </div>
                )}
            </div>
        </>
    );
} 