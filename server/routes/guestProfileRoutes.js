const express = require('express');
const router = express.Router();
const { 
    createGuestProfileAndJoinGame,
    acceptGuestJoinRequest,
    rejectGuestJoinRequest
} = require('../controllers/guestProfileController');
const auth = require('../middleware/auth');
const Game = require("../models/game");

// Create guest profile and join game (no auth required)
router.post('/guest/join-game', createGuestProfileAndJoinGame);

// Add new detailed route matching the client's URL pattern
// This allows users to directly navigate to /guest/join/:gameId
router.get('/guest/join/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        console.log(`Received request for guest join page with gameId: ${gameId}`);
        
        // Find the game data
        const game = await Game.findById(gameId).populate('host_id', 'username');
        
        if (!game) {
            console.log(`Game not found with ID: ${gameId}`);
            return res.status(404).json({ message: 'Game not found' });
        }
        
        console.log(`Found game: ${game.game_name}`);
        
        // Check if game is public
        if (!game.is_public) {
            console.log(`Game ${gameId} is private, cannot be joined by guests`);
            return res.status(403).json({ 
                message: 'This game is private and cannot be joined as a guest' 
            });
        }
        
        // Return the game data to be displayed on the guest join page
        res.json(game);
    } catch (error) {
        console.error('Error handling guest join page request:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Accept guest join request (requires host authentication)
router.post('/guest/accept-request', auth, acceptGuestJoinRequest);

// Reject guest join request (requires host authentication)
router.post('/guest/reject-request', auth, rejectGuestJoinRequest);

module.exports = router;