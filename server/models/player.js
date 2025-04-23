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

// Drop existing indexes and create new ones
playerSchema.pre('save', async function(next) {
    try {
        const collection = this.collection;
        // Drop all indexes except _id
        await collection.dropIndexes();
        
        // Recreate our intended indexes
        await collection.createIndex(
            { game_id: 1, user_id: 1 },
            { 
                unique: true,
                partialFilterExpression: { 
                    is_guest: false,
                    user_id: { $type: "objectId" }
                }
            }
        );
        
        await collection.createIndex(
            { game_id: 1, guest_id: 1 },
            { 
                unique: true,
                partialFilterExpression: { 
                    is_guest: true,
                    guest_id: { $type: "objectId" }
                }
            }
        );
        
        next();
    } catch (error) {
        next(error);
    }
});

const Player = mongoose.model('Player', playerSchema);
module.exports = Player;
