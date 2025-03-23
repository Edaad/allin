// controllers/gameController.js

const Game = require('../models/game');
const Player = require('../models/player');
// Add this import for notification service
const notificationService = require('../services/notificationService');

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

        // Add notification for game creation
        try {
            await notificationService.notifyGameCreated(gameData.host_id, newGame._id);
            console.log("Game creation notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

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

        // Add notification for game update
        try {
            // This will notify both players and the host
            await notificationService.notifyGameEdited(updatedGame._id);
            console.log("Game update notifications sent");
        } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue execution even if notification fails
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

        const players = await Player.find({ game_id: game._id, invitation_status: 'accepted' });
        const playerIds = players.map(player => player.user_id);
        const gameName = game.game_name;
        const hostId = game.host_id;

        // Delete associated players
        await Player.deleteMany({ game_id: game._id });

        // Delete the game
        await Game.findByIdAndDelete(game._id);

        // Send notifications to all players and the host
        try {
            await notificationService.notifyGameDeleted(game._id, gameName, playerIds, hostId);
            console.log("Game deletion notifications sent");
        } catch (notificationError) {
            console.error("Error creating notifications:", notificationError);
            // Continue execution even if notification fails
        }

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

// Add to Waitlist
const addToWaitlist = async (req, res) => {
    const { gameId } = req.params;
    const { userId } = req.body;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Check if the user is already on the waitlist
        if (game.waitlist.includes(userId)) {
            return res.status(400).json({ error: 'User is already on the waitlist' });
        }

        // Add the user to the waitlist
        game.waitlist.push(userId);
        await game.save();

        res.status(200).json({ message: 'Added to waitlist', position: game.waitlist.length });
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        res.status(500).json({ error: 'Failed to add to waitlist' });
    }
};

// Remove from Waitlist
const removeFromWaitlist = async (req, res) => {
    const { gameId, userId } = req.params;

    try {
        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Remove the user from the waitlist
        game.waitlist = game.waitlist.filter(id => id.toString() !== userId);
        await game.save();

        res.status(200).json({ message: 'Removed from waitlist' });
    } catch (error) {
        console.error('Error removing from waitlist:', error);
        res.status(500).json({ error: 'Failed to remove from waitlist' });
    }
};

const getWaitlist = async (req, res) => {
    const { gameId } = req.params;

    try {
        const game = await Game.findById(gameId).populate('waitlist', 'username email');
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        res.status(200).json({ waitlist: game.waitlist });
    } catch (error) {
        console.error('Error fetching waitlist:', error);
        res.status(500).json({ error: 'Failed to fetch waitlist' });
    }
};


module.exports = {
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,
    getGamesForPlayer,
    addToWaitlist,
    removeFromWaitlist,
    getWaitlist
};