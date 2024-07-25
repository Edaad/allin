const Game = require('../models/game');

const getGames = async (req, res) => {
    try {
        const games = await Game.find({});
        res.json(games);
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).send(err);
    }
};

const createGame = async (req, res) => {
    try {
        const newGame = new Game(req.body);
        await newGame.save();
        res.status(201).send(newGame);
    } catch (err) {
        console.error('Error creating game:', err);
        res.status(400).send(err);
    }
};

module.exports = {
    getGames,
    createGame
};
