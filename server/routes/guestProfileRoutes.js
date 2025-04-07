const express = require('express');
const router = express.Router();
const { 
    createGuestProfileAndJoinGame,
    acceptGuestJoinRequest,
    rejectGuestJoinRequest
} = require('../controllers/guestProfileController');
const auth = require('../middleware/auth');

// Create guest profile and join game (no auth required)
router.post('/guest/join-game', createGuestProfileAndJoinGame);

// Accept guest join request (requires host authentication)
router.post('/guest/accept-request', auth, acceptGuestJoinRequest);

// Reject guest join request (requires host authentication)
router.post('/guest/reject-request', auth, rejectGuestJoinRequest);

module.exports = router; 