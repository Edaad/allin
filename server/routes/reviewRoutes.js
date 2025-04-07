const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Create/update a review
router.post('/', reviewController.createReview);

// Get reviews for a host (public route)
router.get('/host/:hostId', reviewController.getHostReviews);

// Get a specific review (public route)
router.get('/:reviewId', reviewController.getReviewById);

// Check if user has reviewed a game
router.get('/game/:gameId/status', reviewController.getReviewStatus);

// Get all reviews by a user (public route)
router.get('/user/:userId', reviewController.getUserReviews);

// Delete a review
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;