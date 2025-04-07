import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ReviewModal.css';

const ReviewModal = ({ gameId, isOpen, onClose, existingReview, onReviewSubmitted }) => {
    const [rating, setRating] = useState(existingReview?.rating || 5);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [gameDetails, setGameDetails] = useState(null);
    const [hostDetails, setHostDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Convert fetchGameDetails to useCallback to prevent recreating on every render
    const fetchGameDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/games/${gameId}`,
                { withCredentials: true }
            );
            setGameDetails(response.data);

            // Fetch host details
            if (response.data.host_id) {
                const hostId = typeof response.data.host_id === 'object'
                    ? response.data.host_id._id
                    : response.data.host_id;

                const hostResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/users/${hostId}`,
                    { withCredentials: true }
                );
                setHostDetails(hostResponse.data);
            }
        } catch (err) {
            console.error('Error fetching game details:', err);
            setError('Failed to load game details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [gameId]); // Add gameId as dependency

    useEffect(() => {
        if (isOpen && gameId) {
            fetchGameDetails();
        }
    }, [isOpen, gameId, fetchGameDetails]); // Added fetchGameDetails to dependencies

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            setError('Please provide a comment');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/reviews`,
                {
                    game_id: gameId,
                    rating,
                    comment
                },
                { withCredentials: true }
            );

            // Call the callback function to notify parent component
            onReviewSubmitted();

            // Close the modal
            onClose();
        } catch (err) {
            console.error('Error submitting review:', err);
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="review-modal-overlay">
            <div className="review-modal">
                <button className="close-button" onClick={onClose}>×</button>

                <h2>{existingReview ? 'Update Review' : 'Review Host'}</h2>

                {loading ? (
                    <div className="loading-container">
                        <span className="modal-spinner"></span>
                        <p>Loading game details...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <>
                        {gameDetails && hostDetails && (
                            <div className="game-host-info">
                                <p>
                                    <strong>Game:</strong> {gameDetails.game_name}
                                </p>
                                <p>
                                    <strong>Host:</strong> {hostDetails.username || hostDetails.names?.display || 'Unknown Host'}
                                </p>
                                <p>
                                    <strong>Date:</strong> {new Date(gameDetails.game_date).toLocaleDateString()}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="rating-container">
                                <label>Rating:</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={star <= rating ? 'star active' : 'star'}
                                            onClick={() => setRating(star)}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="comment-container">
                                <label htmlFor="review-comment">Comment:</label>
                                <textarea
                                    id="review-comment"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Share your experience with this host..."
                                    rows={5}
                                    maxLength={500}
                                    required
                                />
                                <div className="char-count">
                                    {comment.length}/500 characters
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={submitting}
                                >
                                    {submitting ?
                                        <span className="modal-spinner small"></span> :
                                        existingReview ? 'Update Review' : 'Submit Review'
                                    }
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewModal;