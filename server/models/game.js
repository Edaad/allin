const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_name: { type: String, required: true },
    location: { type: String, required: true },
    game_date: { type: Date, required: true },
    game_status: { type: String, enum: ['upcoming', 'completed'], required: true },
    blinds: { type: String, required: true }, // Add blinds to the schema
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

gameSchema.index({ host_id: 1, game_status: 1 }); // Index for faster querying by host and status

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
