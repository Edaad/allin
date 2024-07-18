const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_name: { type: String, required: true },
    location: { type: String, required: true },
    game_date: { type: Date, required: true },
    game_status: { type: String, enum: ['upcoming', 'completed'], required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
