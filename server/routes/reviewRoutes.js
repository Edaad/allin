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
router.post('/', createReview);

// Get reviews for a host (public route)
router.get('/host/:hostId', getHostReviews);

// Get all reviews by a user (public route)
router.get('/user/:userId', getUserReviews);

// Check if user has reviewed a game
router.get('/game/:gameId/status', getReviewStatus);

// Get a specific review (public route) - Move this after more specific routes
router.get('/:reviewId', getReviewById);

// Delete a review
router.delete('/:reviewId', deleteReview);

module.exports = router;