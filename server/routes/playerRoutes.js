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
    removePlayer,
    requestToJoinGame,
    getGameJoinRequests,
    rejectJoinRequest,
    getWaitlistPosition

} = require('../controllers/playerController');

router.get('/players', getPlayers);
router.post('/players', createPlayer);
router.post('/players/send-invitations', sendInvitations);
router.post('/players/cancel-invitation', cancelInvitation);
router.get('/players/game/:gameId', getGamePlayers);
router.post('/players/accept-invitation', acceptInvitation);
router.post('/players/decline-invitation', declineInvitation);
router.get('/players/invitations/:userId', getInvitationsForPlayer);
router.post('/players/remove-player', removePlayer);

router.post('/players/request-to-join', requestToJoinGame);
router.get('/players/requests/:gameId', getGameJoinRequests);
router.post('/players/reject-request', rejectJoinRequest);
router.get('/players/waitlist/:gameId/:userId', getWaitlistPosition);


// Export the router
module.exports = router;
