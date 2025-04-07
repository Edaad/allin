const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Create/update a review (protected route)
router.post('/', authMiddleware, reviewController.createReview);

// Get reviews for a host (public route)
router.get('/host/:hostId', reviewController.getHostReviews);

// Get a specific review (public route)
router.get('/:reviewId', reviewController.getReviewById);

// Check if user has reviewed a game (protected route)
router.get('/game/:gameId/status', authMiddleware, reviewController.getReviewStatus);

// Get all reviews by a user (public route)
router.get('/user/:userId', reviewController.getUserReviews);

// Delete a review (protected route)
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

module.exports = router;