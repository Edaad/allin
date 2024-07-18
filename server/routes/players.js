const express = require('express');
const router = express.Router();
const Player = require('../models/player');

router.get('/', async (req, res) => {
    try {
        const players = await Player.find({});
        res.json(players);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).send(err);
    }
});

router.post('/', async (req, res) => {
    try {
        const newPlayer = new Player(req.body);
        await newPlayer.save();
        res.status(201).send(newPlayer);
    } catch (err) {
        console.error('Error creating player:', err);
        res.status(400).send(err);
    }
});

module.exports = router;
