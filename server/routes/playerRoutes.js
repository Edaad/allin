// routes/playerRoutes.js

const express = require('express');
const router = express.Router();
const {
    getPlayers,
    createPlayer,
    sendInvitations,
    cancelInvitation,
    getGamePlayers,
    acceptInvitation,
    declineInvitation,
    getInvitationsForPlayer,
} = require('../controllers/playerController');

// Route to get all players
router.get('/players', getPlayers);

// Route to create a new player (unused in this context)
router.post('/players', createPlayer);

// Route to send game invitations
router.post('/players/send-invitations', sendInvitations);

// Route to cancel a game invitation
router.post('/players/cancel-invitation', cancelInvitation);

// Route to get all players for a specific game
router.get('/players/game/:gameId', getGamePlayers);

// Route to accept a game invitation
router.post('/players/accept-invitation', acceptInvitation);

// Route to decline a game invitation
router.post('/players/decline-invitation', declineInvitation);

// Route to get invitations for a player
router.get('/players/invitations/:userId', getInvitationsForPlayer);

// Export the router
module.exports = router;
