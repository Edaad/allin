const express = require('express');
const router = express.Router();
const { getGames, createGame } = require('../controllers/gameController');

router.get('/games', getGames);
router.post('/games', createGame);

module.exports = router;
