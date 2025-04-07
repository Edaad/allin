const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: function() { return !this.is_guest; }
    },
    game_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Game', 
        required: true 
    },
    is_guest: { 
        type: Boolean, 
        default: false 
    },
    guest_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'GuestProfile',
        required: function() { return this.is_guest; }
    },
    invitation_status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'requested', 'waitlist'],
        default: 'pending'
    },
    rejection_reason: { type: String, default: null },
    buy_in_amount: { type: Number, default: 0.00 },
    cash_out_amount: { type: Number, default: 0.00 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Ensure a user/guest is invited only once per game
playerSchema.index({ 
    game_id: 1,
    $or: [
        { user_id: 1 },
        { guest_id: 1 }
    ]
}, { unique: true });

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
