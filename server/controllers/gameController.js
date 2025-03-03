// controllers/gameController.js

const Game = require('../models/game');
const Player = require('../models/player');

const getGames = async (req, res) => {
    try {
        const { status, host_id, is_public, blinds, handed, userId } = req.query;
        const query = {};

        // Filter by game_status if provided
        if (status) {
            query.game_status = status;
        }

        // Filter by host_id if provided
        if (host_id) {
            query.host_id = host_id;
        }

        // Filter by is_public if provided
        if (is_public !== undefined) {
            // Convert the string to a boolean
            query.is_public = (is_public === 'true');
        }

        // Filter by blinds if provided
        if (blinds) {
            if (Array.isArray(blinds)) {
                query.blinds = { $in: blinds };
            } else {
                query.blinds = { $in: blinds.split(',') };
            }
        }

        // Filter by handed if provided
        if (handed) {
            query.handed = Number(handed);
        }

        const games = await Game.find(query).populate('host_id', 'username');

        // If userId is provided, add player status to each game
        if (userId) {
            // Find all games where the user has any relationship
            const playerRecords = await Player.find({
                user_id: userId,
                game_id: { $in: games.map(g => g._id) }
            });

            // Create a map of gameId to player status for quick lookup
            const playerStatusMap = {};
            playerRecords.forEach(record => {
                playerStatusMap[record.game_id.toString()] = record.invitation_status;
            });

            const playerGames = games.map(game => {
                const gameObj = game.toObject();
                const gameId = game._id.toString();

                // Set player status from the map or 'none' if not found
                gameObj.playerStatus = playerStatusMap[gameId] || 'none';

                return gameObj;
            });

            return res.json(playerGames);
        }

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
        // Create a new object with explicit boolean conversion for is_public
        const gameData = {
            ...req.body,
            is_public: req.body.is_public === true
        };

        console.log("Creating game with data:", gameData);

        const newGame = new Game(gameData);
        await newGame.save();
        console.log("Game created:", newGame);
        res.status(201).send(newGame);
    } catch (err) {
        console.error('Error creating game:', err);
        res.status(400).send(err);
    }
};

const updateGame = async (req, res) => {
    try {
        // Ensure boolean conversion for is_public field
        const updateData = {
            ...req.body
        };

        if (updateData.is_public !== undefined) {
            updateData.is_public = updateData.is_public === true;
        }

        const updatedGame = await Game.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

        // Updated query to only show games the user has joined (accepted invitations)
        const query = {
            _id: { $in: acceptedGameIds }
        };

        if (status) {
            query.game_status = status;
        }

        // Get all matching games
        const games = await Game.find(query).populate('host_id', 'username');

        // Add player status to each game (all should be 'accepted' in this case)
        const gamesWithStatus = games.map(game => {
            const gameObject = game.toObject();
            gameObject.playerStatus = 'accepted';
            return gameObject;
        });

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