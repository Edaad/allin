const express = require('express');
const router = express.Router();
const { getPlayers, createPlayer } = require('../controllers/playerController');

router.get('/players', getPlayers);
router.post('/players', createPlayer);

module.exports = router;
