const Game = require('../models/game');

const getGames = async (req, res) => {
    try {
        const { status } = req.query;
        const games = await Game.find({ game_status: status });
        res.json(games);
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).send(err);
    }
};


const getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).send({ message: 'Game not found' });
        }
        res.json(game);
    } catch (err) {
        console.error('Error fetching game:', err);
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

const updateGame = async (req, res) => {
    try {
        const updatedGame = await Game.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedGame) {
            return res.status(404).send({ message: 'Game not found' });
        }
        res.json(updatedGame);
    } catch (err) {
        console.error('Error updating game:', err);
        res.status(400).send(err);
    }
};

const deleteGame = async (req, res) => {
    try {
        const deletedGame = await Game.findByIdAndDelete(req.params.id);
        if (!deletedGame) {
            return res.status(404).send({ message: 'Game not found' });
        }
        res.json({ message: 'Game deleted successfully' });
    } catch (err) {
        console.error('Error deleting game:', err);
        res.status(500).send(err);
    }
};

module.exports = {
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame
};
