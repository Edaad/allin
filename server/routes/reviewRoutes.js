const express = require('express');
const router = express.Router();
const {
    createReview,
    getHostReviews,
    getReviewById,
    getReviewStatus,
    getUserReviews,
    deleteReview
} = require('../controllers/reviewController');

// Create/update a review
router.post('/reviews', createReview);

// Get reviews for a host (public route)
router.get('/reviews/host/:hostId', getHostReviews);

// Get a specific review (public route)
router.get('/reviews/:reviewId', getReviewById);

// Check if user has reviewed a game
router.get('/reviews/game/:gameId/status', getReviewStatus);

// Get all reviews by a user (public route)
router.get('/reviews/user/:userId', getUserReviews);

// Delete a review
router.delete('/reviews/:reviewId', deleteReview);

module.exports = router;