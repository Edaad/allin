const express = require('express');
const router = express.Router();
const { getGames, getGameById, createGame, updateGame, deleteGame } = require('../controllers/gameController');

router.get('/games', getGames);
router.get('/games/:id', getGameById); // Route for fetching a single game by ID
router.post('/games', createGame);
router.put('/games/:id', updateGame); // Route for updating a game
router.delete('/games/:id', deleteGame); // Route for deleting a game

module.exports = router;
