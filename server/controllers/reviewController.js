const Review = require('../models/review');
const Game = require('../models/game');
const Player = require('../models/player');
const User = require('../models/user');
const notificationService = require('../services/notificationService');

// Create or update a review
const createReview = async (req, res) => {
    try {
        const { game_id, rating, comment, reviewer_id } = req.body;

        // Validate input
        if (!game_id || !rating || !comment || !reviewer_id) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Get the game to check if it's completed and get host_id
        const game = await Game.findById(game_id);
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        // Check if game is completed
        if (game.game_status !== 'completed') {
            return res.status(400).json({ message: 'Cannot review an uncompleted game' });
        }

        // Prevent host from reviewing their own game
        if (game.host_id.toString() === reviewer_id) {
            return res.status(400).json({ message: 'You cannot review your own game' });
        }

        // Check if user was an accepted player in this game
        const playerRecord = await Player.findOne({
            user_id: reviewer_id,
            game_id: game_id,
            invitation_status: 'accepted'
        });

        if (!playerRecord) {
            return res.status(403).json({ message: 'You must be an accepted player in this game to leave a review' });
        }

        // Check if review already exists and update it, otherwise create new
        let review = await Review.findOne({ reviewer_id, game_id });

        if (review) {
            // Update existing review
            review.rating = rating;
            review.comment = comment;
            review.updated_at = Date.now();
            await review.save();

            return res.status(200).json({ message: 'Review updated successfully', review });
        } else {
            // Create new review
            review = new Review({
                reviewer_id,
                host_id: game.host_id,
                game_id,
                rating,
                comment
            });

            await review.save();

            // Create notification for host
            await notificationService.createNotification({
                user_id: game.host_id,
                type: 'host_review_received',
                title: 'New Host Review',
                message: `You received a new review for "${game.game_name}"`,
                referenced_id: review._id,
                referenced_model: 'Review',
                link: `/profile/${reviewer_id}`
            });

            return res.status(201).json({ message: 'Review created successfully', review });
        }
    } catch (err) {
        console.error('Error creating/updating review:', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: 'You have already reviewed this game' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

// Get reviews for a specific host
const getHostReviews = async (req, res) => {
    try {
        const { hostId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Convert to integers
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);

        // Calculate skip value for pagination
        const skip = (pageInt - 1) * limitInt;

        // Find reviews for the host
        const reviews = await Review.find({ host_id: hostId })
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limitInt)
            .populate('reviewer_id', 'username names')
            .populate('game_id', 'game_name game_date');

        // Count total reviews for pagination
        const totalReviews = await Review.countDocuments({ host_id: hostId });

        // Calculate average rating
        const aggregateResult = await Review.aggregate([
            { $match: { host_id: mongoose.Types.ObjectId(hostId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);

        const averageRating = aggregateResult.length > 0
            ? parseFloat(aggregateResult[0].averageRating.toFixed(1))
            : 0;

        res.status(200).json({
            reviews,
            totalReviews,
            averageRating,
            totalPages: Math.ceil(totalReviews / limitInt),
            currentPage: pageInt
        });
    } catch (err) {
        console.error('Error fetching host reviews:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get a specific review
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

// Check if user has reviewed a specific game
const getReviewStatus = async (req, res) => {
    try {
        const { gameId } = req.params;

        // Get user ID from cookies or token instead of req.user
        // This depends on how authentication is handled in your app

        // Option 1: If your userId is in the query params
        const userId = req.query.userId;

        // Option 2: If you have a cookie or token
        // const userId = req.cookies.userId || req.headers.authorization;

        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const review = await Review.findOne({
            reviewer_id: userId,
            game_id: gameId
        });

        if (!review) {
            return res.status(200).json({ hasReviewed: false });
        }

        res.status(200).json({
            hasReviewed: true,
            review
        });
    } catch (err) {
        console.error('Error checking review status:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all reviews by a user
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

// Delete a review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if the user is the reviewer
        if (review.reviewer_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }

        await review.remove();
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