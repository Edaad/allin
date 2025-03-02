// controllers/gameController.js

const Game = require('../models/game');
const Player = require('../models/player');

const getGames = async (req, res) => {
    try {
      const { status, host_id, is_public, blinds, handed } = req.query;
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
  
      // Filter by blinds if provided.
      // This expects blinds to be either an array or a comma-separated string.
      if (blinds) {
        if (Array.isArray(blinds)) {
          query.blinds = { $in: blinds };
        } else {
          query.blinds = { $in: blinds.split(',') };
        }
      }
  
      // Filter by handed if provided.
      if (handed) {
        query.handed = Number(handed);
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
        const playerFilter = {
            user_id: userId,
            invitation_status: 'accepted',
        };

        const playerGames = await Player.find(playerFilter).select('game_id');

        const gameIds = playerGames.map(pg => pg.game_id);

        const query = { _id: { $in: gameIds } };

        if (status) {
            query.game_status = status;
        }

        const games = await Game.find(query).populate('host_id', 'username');

        res.status(200).json(games);
    } catch (err) {
        console.error('Error fetching games for player:', err);
        res.status(500).send(err);
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
