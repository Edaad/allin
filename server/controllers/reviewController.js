// controllers/reviewController.js

const Review = require('../models/review');
const User = require('../models/user');
const reviewService = require('../services/reviewService');
const mongoose = require('mongoose');

const createReview = async (req, res) => {
  try {
    const { game_id, rating, comment, reviewer_id } = req.body;
    const result = await reviewService.createOrUpdateReview({ game_id, rating, comment, reviewer_id });
    res.status(result.message.includes('updated') ? 200 : 201).json(result);
  } catch (err) {
    console.error('Error creating/updating review:', err);
    if (err.message === 'Missing required fields' || err.message.includes('Cannot review') || err.message.includes('You cannot review') || err.message.includes('You must be an accepted')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this game' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

const getHostReviews = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const result = await reviewService.getHostReviewsWithMeta(hostId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching host reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId)
      .populate('reviewer_id', 'username names')
      .populate('host_id', 'username names')
      .populate('game_id', 'game_name game_date');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (err) {
    console.error('Error fetching review:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReviewStatus = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const review = await Review.findOne({ reviewer_id: userId, game_id: gameId });

    if (!review) {
      return res.status(200).json({ hasReviewed: false });
    }

    res.status(200).json({ hasReviewed: true, review });
  } catch (err) {
    console.error('Error checking review status:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await Review.find({ reviewer_id: userId })
      .sort({ created_at: -1 })
      .populate('host_id', 'username names')
      .populate('game_id', 'game_name game_date');

    res.status(200).json(reviews);
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer_id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await review.deleteOne();
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReview,
  getHostReviews,
  getReviewById,
  getReviewStatus,
  getUserReviews,
  deleteReview
};
