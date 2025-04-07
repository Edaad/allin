import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './HostReviews.css';

const HostReviews = ({ hostId }) => {
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expanded, setExpanded] = useState(false);

    // Convert fetchReviews to useCallback to prevent recreating on every render
    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/reviews/host/${hostId}?page=${currentPage}&limit=5`
            );

            setReviews(response.data.reviews);
            setAverageRating(response.data.averageRating);
            setTotalReviews(response.data.totalReviews);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            console.error('Error fetching host reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    }, [hostId, currentPage]); // Add dependencies here

    useEffect(() => {
        if (hostId) {
            fetchReviews();
        }
    }, [hostId, currentPage, fetchReviews]); // Added fetchReviews to dependencies

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Format date to readable format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // If there are no reviews, show appropriate message
    if (!loading && totalReviews === 0) {
        return (
            <div className="host-reviews-container">
                <div className="host-reviews-header">
                    <h3>Host Reviews</h3>
                </div>
                <div className="no-reviews-message">
                    <p>This host hasn't received any reviews yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="host-reviews-container">
            <div
                className="host-reviews-header"
                onClick={() => setExpanded(!expanded)}
                role="button"
                tabIndex={0}
            >
                <h3>Host Reviews</h3>
                <div className="reviews-summary">
                    <div className="average-rating">
                        <span className="star-icon">★</span>
                        <span>{averageRating.toFixed(1)}</span>
                    </div>
                    <span className="review-count">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    <button className="expand-button">
                        {expanded ? '▼' : '▶'}
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="reviews-content">
                    {loading ? (
                        <div className="reviews-loading">
                            <span className="reviews-spinner"></span>
                            <p>Loading reviews...</p>
                        </div>
                    ) : error ? (
                        <div className="reviews-error">{error}</div>
                    ) : (
                        <>
                            <div className="reviews-list">
                                {reviews.map((review) => (
                                    <div key={review._id} className="review-item">
                                        <div className="review-header">
                                            <div className="reviewer-info">
                                                <span className="reviewer-name">
                                                    {review.reviewer_id?.username || review.reviewer_id?.names?.display || 'Anonymous'}
                                                </span>
                                                <span className="review-date">{formatDate(review.created_at)}</span>
                                            </div>
                                            <div className="review-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`review-star ${i < review.rating ? 'filled' : ''}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="review-game">
                                            Game: {review.game_id?.game_name || 'Unknown Game'}
                                        </div>
                                        <div className="review-comment">
                                            {review.comment}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="page-button"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>

                                    <span className="page-info">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        className="page-button"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default HostReviews;