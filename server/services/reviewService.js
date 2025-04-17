// services/reviewService.js

const Review = require('../models/review');
const Game = require('../models/game');
const Player = require('../models/player');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

const validateReviewInput = ({ game_id, rating, comment, reviewer_id }) => {
  if (!game_id || !rating || !comment || !reviewer_id) {
    throw new Error('Missing required fields');
  }
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
};

const checkGameValidityForReview = async (game_id, reviewer_id) => {
  const game = await Game.findById(game_id);
  if (!game) throw new Error('Game not found');
  if (game.game_status !== 'completed') throw new Error('Cannot review an uncompleted game');
  if (game.host_id.toString() === reviewer_id) throw new Error('You cannot review your own game');
  return game;
};

const checkPlayerParticipation = async (reviewer_id, game_id) => {
  const playerRecord = await Player.findOne({
    user_id: reviewer_id,
    game_id: game_id,
    invitation_status: 'accepted'
  });
  if (!playerRecord) throw new Error('You must be an accepted player in this game to leave a review');
};

const saveNotificationForReview = async (host_id, game_name, reviewer_id, reviewId) => {
  try {
    const notification = new Notification({
      user_id: host_id,
      type: 'host_review_received',
      title: 'New Host Review',
      message: `You received a new review for "${game_name}"`,
      referenced_id: reviewId,
      referenced_model: 'Review',
      link: `/profile/${reviewer_id}`
    });
    await notification.save();
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

const createOrUpdateReview = async ({ game_id, rating, comment, reviewer_id }) => {
  validateReviewInput({ game_id, rating, comment, reviewer_id });
  const game = await checkGameValidityForReview(game_id, reviewer_id);
  await checkPlayerParticipation(reviewer_id, game_id);

  let review = await Review.findOne({ reviewer_id, game_id });

  if (review) {
    review.rating = rating;
    review.comment = comment;
    review.updated_at = Date.now();
    await review.save();
    return { message: 'Review updated successfully', review };
  } else {
    review = new Review({ reviewer_id, host_id: game.host_id, game_id, rating, comment });
    await review.save();
    await saveNotificationForReview(game.host_id, game.game_name, reviewer_id, review._id);
    return { message: 'Review created successfully', review };
  }
};

const getHostReviewsWithMeta = async (hostId, page = 1, limit = 10) => {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const skip = (pageInt - 1) * limitInt;

  const reviews = await Review.find({ host_id: hostId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limitInt)
    .populate('reviewer_id', 'username names')
    .populate('game_id', 'game_name game_date');

  const totalReviews = await Review.countDocuments({ host_id: hostId });

  const aggregateResult = await Review.aggregate([
    { $match: { host_id: new mongoose.Types.ObjectId(hostId) } },
    { $group: { _id: null, averageRating: { $avg: "$rating" } } }
  ]);

  const averageRating = aggregateResult.length > 0
    ? parseFloat(aggregateResult[0].averageRating.toFixed(1))
    : 0;

  return {
    reviews,
    totalReviews,
    averageRating,
    totalPages: Math.ceil(totalReviews / limitInt),
    currentPage: pageInt
  };
};

module.exports = {
  createOrUpdateReview,
  getHostReviewsWithMeta
};
