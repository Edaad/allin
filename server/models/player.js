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
        enum: ['pending', 'accepted', 'rejected', 'requested', 'waitlist', 'waitlist_requested'], // Added 'waitlist' status
        default: 'pending'
    },
    rejection_reason: { type: String, default: null },
    buy_in_amount: { type: Number, default: 0.00 },
    cash_out_amount: { type: Number, default: 0.00 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Improve the index for regular players to explicitly exclude guest players
playerSchema.index({ game_id: 1, user_id: 1 }, { 
    unique: true,
    partialFilterExpression: { 
        is_guest: { $eq: false },  // Only apply to non-guest players
        user_id: { $exists: true, $ne: null }  // Ensure user_id exists and is not null
    }
});

// Index for guest players 
playerSchema.index({ game_id: 1, guest_id: 1 }, { 
    unique: true,
    partialFilterExpression: { 
        is_guest: { $eq: true },  // Only apply to guest players
        guest_id: { $exists: true, $ne: null }  // Ensure guest_id exists and is not null
    }
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
