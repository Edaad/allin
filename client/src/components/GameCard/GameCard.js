import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameCard.css';

function GameCard({ game, user }) {
    const navigate = useNavigate();
    const [showReason, setShowReason] = useState(false);

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
                        {renderStatusBadge()}
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
                    <p className="info-value"><span>Blinds:</span> {game.blinds}</p>
                </div>

                <div className="game-info-row">
                    <p className="info-value">Handed: {game.handed}</p>
                </div>

            </div>


        </div>
    );
}

export default GameCard;