const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    invitation_status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'requested', 'waitlist', 'waitlist_requested'], // Added 'waitlist' status
        default: 'pending'
    },
    rejection_reason: { type: String, default: null }, // New field for rejection reason
    buy_in_amount: { type: Number, default: 0.00 },
    cash_out_amount: { type: Number, default: 0.00 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Ensure a user is invited only once per game
playerSchema.index({ user_id: 1, game_id: 1 }, { unique: true });

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
