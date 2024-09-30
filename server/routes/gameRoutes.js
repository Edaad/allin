// routes/gameRoutes.js

const express = require('express');
const router = express.Router();
const {
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    getGamesForPlayer,
} = require('../controllers/gameController');

// Route for fetching games with optional filters
router.get('/games', getGames);

// Route for fetching a single game by ID
router.get('/games/:id', getGameById);

// Route for creating a new game
router.post('/games', createGame);

// Route for updating a game
router.put('/games/:id', updateGame);

// Route for deleting a game
router.delete('/games/:id', deleteGame);

// Route for fetching games for a player
router.get('/games/player/:userId', getGamesForPlayer);

module.exports = router;
