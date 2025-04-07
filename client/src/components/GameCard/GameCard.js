import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GameCard.css';
import ReviewButton from '../ReviewButton/ReviewButton';
import ReviewModal from '../ReviewModal/ReviewModal';

function GameCard({ game, user, customActions }) {
    const navigate = useNavigate();
    const [showReason, setShowReason] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [playerStatus, setPlayerStatus] = useState(game.playerStatus || 'none');
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Format date to be more readable
    const formatDate = (dateString) => {
        const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    // Format time to 12 hour format
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const handleRequestToJoin = async (e) => {
        // Prevent the card click from triggering navigation
        e.stopPropagation();

        if (isRequesting) return;

        try {
            setIsRequesting(true);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/players/request-to-join`, {
                userId: user._id,
                gameId: game._id
            });

            // Update status based on response
            const newStatus = response.data.status || 'requested';
            setPlayerStatus(newStatus);

            setIsRequesting(false);
        } catch (error) {
            console.error('Error requesting to join game:', error);
            setIsRequesting(false);
        }
    };

    const handleReviewClick = (gameId, hasReviewed) => {
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = () => {
        // Refresh game data if needed
        // You might want to call a prop method to refresh parent component data
    };

    // Render the appropriate status badge or action button based on player status
    const renderStatusBadge = () => {
        // If game is public and player hasn't made any action yet
        if (game.is_public && (playerStatus === 'none' || !playerStatus)) {
            // Check if the game is full by comparing accepted players to game.handed
            const isFull = game.acceptedPlayersCount >= game.handed;

            return (
                <button
                    className="request-button"
                    onClick={handleRequestToJoin}
                    disabled={isRequesting || game.game_status === 'completed'}
                >
                    {isFull ? "Join Waitlist" : "Request to Join"}
                </button>
            );
        }

        // Check if game is completed first, regardless of player status
        if (game.game_status === 'completed') {
            return <span className="status-badge completed">Completed</span>;
        }

        // Otherwise, show status badges for upcoming games
        switch (playerStatus) {
            case 'accepted':
                return <span className="status-badge accepted">Joined</span>;
            case 'pending':
                return <span className="status-badge pending">Invitation Pending</span>;
            case 'requested':
                return <span className="status-badge requested">Request Pending</span>;
            case 'waitlist':
                return (
                    <span className="status-badge waitlist">
                        On Waitlist {game.waitlistPosition ? `(#${game.waitlistPosition})` : ''}
                    </span>
                );
            case 'rejected':
                return (
                    <div className="status-badge-container">
                        {game.rejectionReason && (
                            <span
                                className="info-icon"
                                onMouseEnter={() => setShowReason(true)}
                                onMouseLeave={() => setShowReason(false)}
                            >
                                ⓘ
                            </span>
                        )}
                        <span className="status-badge rejected">Request Rejected</span>

                        {showReason && game.rejectionReason && (
                            <div className="rejection-reason-tooltip">
                                {game.rejectionReason}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleCardClick = () => {
        // If custom actions are provided, don't navigate on click
        if (customActions) return;
        navigate(`/dashboard/${user._id}/games/game/${game._id}`);
    };

    return (
        <div className="game-card" onClick={handleCardClick}>
            <div className="game-card-header">
                <div className="game-header">
                    <h3 className='game-title'>{game.game_name}</h3>
                    <h4 className='game-host'>{game.host_id?.username}</h4>
                </div>
                <div className="game-privacy">
                    {game.is_public ?
                        <span className="privacy-tag public">Public</span> :
                        <span className="privacy-tag private">Private</span>
                    }
                    <div className="game-card-footer">
                        {customActions || renderStatusBadge()}
                        <ReviewButton
                            gameId={game._id}
                            gameStatus={game.game_status}
                            isHost={user._id === game.host_id}
                            onReviewClick={handleReviewClick}
                        />
                    </div>
                </div>
            </div>

            <div className="game-card-content">
                <div className="game-info-row">
                    <p className="info-value">{formatDate(game.game_date)} at {formatTime(game.game_date)}</p>
                </div>

                <div className="game-info-row">
                    <p className="info-value">{game.location}</p>
                </div>

                <div className="game-info-row">
                    <p className="info-value"><span>Blinds: {game.blinds}</span> <span>Players: {game.handed}</span></p>
                </div>
            </div>

            {showReviewModal && (
                <ReviewModal
                    gameId={game._id}
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onReviewSubmitted={handleReviewSubmitted}
                />
            )}
        </div>
    );
}

export default GameCard;