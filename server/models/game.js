const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_name: { type: String, required: true },
    location: { type: String, required: true },
    game_date: { type: Date, required: true },
    game_status: { type: String, enum: ['upcoming', 'completed'], required: true },
    blinds: { type: String, required: true },
    handed: { type: Number, required: true },
    notes: { type: String, default: '' },
    is_public: { type: Boolean, default: false }, // New field for public/private games
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Index for faster querying by host and status
gameSchema.index({ host_id: 1, game_status: 1 });
gameSchema.index({ is_public: 1, game_status: 1 }); // New index for querying public games

// Middleware to remove related players when a game is deleted
gameSchema.pre('remove', async function (next) {
    try {
        const Player = mongoose.model('Player'); // Get the Player model
        await Player.deleteMany({ game_id: this._id });
        next();
    } catch (err) {
        console.error('Error in pre-remove middleware:', err);
        next(err);
    }
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;