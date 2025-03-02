// controllers/gameController.js

const Game = require('../models/game');
const Player = require('../models/player');

const getGames = async (req, res) => {
    try {
        const { status, host_id } = req.query;
        const query = {};

        if (status) {
            query.game_status = status;
        }

        if (host_id) {
            query.host_id = host_id;
        }

        const games = await Game.find(query).populate('host_id', 'username');
        res.json(games);
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).send(err);
    }
};

const getGameById = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('host_id', 'username');
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
        console.log("Creating game with data:", req.body); // Add this line
        const newGame = new Game(req.body);
        await newGame.save();
        console.log("Game created:", newGame); // Add this line
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

// controllers/gameController.js

const deleteGame = async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).send({ message: 'Game not found' });
        }

        // Delete associated players
        await Player.deleteMany({ game_id: game._id });

        // Delete the game
        await Game.findByIdAndDelete(game._id);

        res.json({ message: 'Game and associated players deleted successfully' });
    } catch (err) {
        console.error('Error deleting game:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};



// Get games for a player with optional status filter
const getGamesForPlayer = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        // Find all games where the user is a player and invitation_status is 'accepted'
        const playerGames = await Player.find({
            user_id: userId,
            invitation_status: 'accepted',
        }).select('game_id');

        const acceptedGameIds = playerGames.map(pg => pg.game_id);

        // Find all games the user has requested to join
        const requestedGames = await Player.find({
            user_id: userId,
            invitation_status: 'requested',
        }).select('game_id');

        const requestedGameIds = requestedGames.map(rg => rg.game_id);

        // Find all games the user has pending invitations for
        const pendingGames = await Player.find({
            user_id: userId,
            invitation_status: 'pending',
        }).select('game_id');

        const pendingGameIds = pendingGames.map(pg => pg.game_id);

        // Base query for games
        const query = {
            $or: [
                { _id: { $in: acceptedGameIds } }, // Games user is accepted to
                {
                    is_public: true,
                    _id: { $nin: [...acceptedGameIds, ...requestedGameIds, ...pendingGameIds] }
                } // Public games user hasn't joined or requested
            ]
        };

        if (status) {
            query.game_status = status;
        }

        // Get all matching games
        const games = await Game.find(query).populate('host_id', 'username');

        // Add player status to each game
        const gamesWithStatus = await Promise.all(games.map(async (game) => {
            const gameObject = game.toObject();

            // Check if user is accepted
            if (acceptedGameIds.some(id => id.equals(game._id))) {
                gameObject.playerStatus = 'accepted';
            }
            // Check if user has requested to join
            else if (requestedGameIds.some(id => id.equals(game._id))) {
                gameObject.playerStatus = 'requested';
            }
            // Check if user has pending invitation
            else if (pendingGameIds.some(id => id.equals(game._id))) {
                gameObject.playerStatus = 'pending';
            }
            // Otherwise user has no relation to this game yet
            else {
                gameObject.playerStatus = 'none';
            }

            return gameObject;
        }));

        res.status(200).json(gamesWithStatus);
    } catch (err) {
        console.error('Error fetching games for player:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    getGamesForPlayer,
};
