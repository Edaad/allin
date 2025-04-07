const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    host_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    game_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Create a compound index to ensure one review per game per reviewer
reviewSchema.index({ reviewer_id: 1, game_id: 1 }, { unique: true });

// Create indexes for frequent queries
reviewSchema.index({ host_id: 1, created_at: -1 });
reviewSchema.index({ game_id: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;