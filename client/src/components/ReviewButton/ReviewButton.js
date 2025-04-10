import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ReviewButton.css';

const ReviewButton = ({ gameId, gameStatus, isHost, onReviewClick }) => {
    const [hasReviewed, setHasReviewed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Update the checkReviewStatus function
    const checkReviewStatus = useCallback(async () => {
        try {
            setLoading(true);

            // Get user ID from localStorage
            const user = JSON.parse(localStorage.getItem('user'));

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/reviews/game/${gameId}/status?userId=${user._id}`,
                { withCredentials: true }
            );
            setHasReviewed(response.data.hasReviewed);
        } catch (error) {
            console.error('Error checking review status:', error);
        } finally {
            setLoading(false);
        }
    }, [gameId]);

    useEffect(() => {
        // Only check review status if game is completed and user is not the host
        if (gameStatus === 'completed' && !isHost) {
            checkReviewStatus();
        } else {
            setLoading(false);
        }
    }, [gameId, gameStatus, isHost, checkReviewStatus]); // Added checkReviewStatus to dependencies

    // Don't render anything if game is not completed or user is the host
    if (gameStatus !== 'completed' || isHost) {
        return null;
    }

    return (
        <button
            className={`review-button ${hasReviewed ? 'reviewed' : ''}`}
            onClick={() => onReviewClick(gameId, hasReviewed)}
            disabled={loading}
        >
            {hasReviewed ? (
                <>
                    <i className="fas fa-check-circle"></i>
                    <span>Reviewed Host</span>
                </>
            ) : (
                <>
                    <i className="fas fa-star"></i>
                    <span>Review Host</span>
                </>
            )}
        </button>
    );
};

export default ReviewButton;