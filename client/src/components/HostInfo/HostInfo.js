import React, { useState } from "react";
import "./HostInfo.css";
// Import the PokerChipAvatar component
import PokerChipAvatar from "../PokerChipAvatar/PokerChipAvatar";

/**
 * Displays host information and reviews
 */
const HostInfo = ({ hostProfile, hostStats, hostReviews, averageRating, formatDate }) => {
    const [showMoreReviews, setShowMoreReviews] = useState(false);

    if (!hostProfile) return null;

    return (
        <div className="host-info-wrapper">
            <h2>Host Details</h2>

            <div className="host-info">
                <div className="host-header">
                    <div className="host-avatar">
                        {/* Replace generateAvatar with PokerChipAvatar */}
                        <PokerChipAvatar
                            username={hostProfile.username}
                            firstName={hostProfile.names?.firstName || ''}
                            lastName={hostProfile.names?.lastName || ''}
                            className="avatar-image"
                        />
                    </div>
                    <div className="host-details">
                        <h3 className="host-name">{hostProfile.username}</h3>
                        <div className="host-stats">
                            <div className="stat-item">
                                <span className="stat-label">Member Since</span>
                                <span className="stat-value">{hostStats.memberSince}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Games Hosted</span>
                                <span className="stat-value">{hostStats.gamesHosted}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Games Played</span>
                                <span className="stat-value">{hostStats.gamesPlayed}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {hostReviews.length > 0 && (
                    <div className="host-reviews">
                        <div className="reviews-header">
                            <div className="reviews-rating-summary">
                                <div className="rating-display">
                                    <span className="rating-number">
                                        {averageRating.toFixed(1)}
                                    </span>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={`star ${star <= Math.round(averageRating) ? "filled" : ""
                                                    }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <h4 style={{ marginTop: "20px" }}>Recent Reviews</h4>
                        </div>
                        <div className="reviews-list">
                            {hostReviews
                                .slice(0, showMoreReviews ? undefined : 2)
                                .map((review) => (
                                    <div key={review._id} className="review-item">
                                        <div className="review-header">
                                            {/* Add PokerChipAvatar for reviewer avatar */}
                                            <div className="reviewer-info">
                                                <span className="reviewer-name">
                                                    {review.reviewer_id?.username || "Anonymous"}
                                                </span>
                                            </div>
                                            <div className="review-stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`review-star ${i < review.rating ? "filled" : ""
                                                            }`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="review-date">
                                            {formatDate(review.created_at)}
                                        </div>
                                        <div className="review-comment">{review.comment}</div>
                                    </div>
                                ))}
                        </div>
                        {hostReviews.length > 1 && (
                            <button
                                className="show-more-reviews"
                                onClick={() => setShowMoreReviews(!showMoreReviews)}
                            >
                                {showMoreReviews
                                    ? "Show Less"
                                    : `See All ${hostReviews.length} Reviews`}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div className="section-divider"></div>
        </div>
    );
};

export default HostInfo;