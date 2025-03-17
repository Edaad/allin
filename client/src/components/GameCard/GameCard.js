import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameCard.css';

function GameCard({ game, user }) {
    const navigate = useNavigate();
    const [showReason, setShowReason] = useState(false);

    // Format date to be more readable
    const formatDate = (dateString) => {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
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

    // Render the appropriate status badge based on player status
    const renderStatusBadge = () => {
        switch (game.playerStatus) {
            case 'accepted':
                return <span className="status-badge accepted">Joined</span>;
            case 'pending':
                return <span className="status-badge pending">Invitation Pending</span>;
            case 'requested':
                return <span className="status-badge requested">Request Pending</span>;
            case 'rejected':
                return (
                    <div className="status-badge-container">
                        <span className="status-badge rejected">Request Rejected</span>
                        {game.rejectionReason && (
                            <span
                                className="info-icon"
                                onMouseEnter={() => setShowReason(true)}
                                onMouseLeave={() => setShowReason(false)}
                            >
                                ⓘ
                            </span>
                        )}
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
        navigate(`/dashboard/${user._id}/games/game/${game._id}`);
    };

    return (
        <div className="game-card" onClick={handleCardClick}>
            <div className="game-card-header">
                <h3 className="game-title">{game.game_name}</h3>
                <div className="game-privacy">
                    {game.is_public ?
                        <span className="privacy-tag public">Public</span> :
                        <span className="privacy-tag private">Private</span>
                    }
                </div>
            </div>

            <div className="game-card-content">
                <div className="game-info-row">
                    <span className="info-label">Host:</span>
                    <span className="info-value">{game.host_id?.username || 'Unknown'}</span>
                </div>

                <div className="game-info-row">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{game.location}</span>
                </div>

                <div className="game-info-row">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{formatDate(game.game_date)}</span>
                </div>

                <div className="game-info-row">
                    <span className="info-label">Time:</span>
                    <span className="info-value">{formatTime(game.game_date)}</span>
                </div>

                <div className="game-info-row">
                    <span className="info-label">Blinds:</span>
                    <span className="info-value">{game.blinds}</span>
                </div>
            </div>

            <div className="game-card-footer">
                {renderStatusBadge()}
            </div>
        </div>
    );
}

export default GameCard;