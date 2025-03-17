// routes/groupMemberRoutes.js
const express = require('express');
const router = express.Router();
const {
    getGroupMembers,
    sendInvitations,
    cancelInvitation,
    requestToJoin,
    getJoinRequests,
    acceptInvitation,
    declineInvitation,
    rejectJoinRequest,
    getInvitationsForUser,
    removeMember,
    getRequestedGroups
} = require('../controllers/groupMemberController');

// Get all members of a group
router.get('/group-members/:groupId', getGroupMembers);

// Send invitations to join a group
router.post('/group-members/send-invitations', sendInvitations);

// Cancel an invitation
router.post('/group-members/cancel-invitation', cancelInvitation);

// Request to join a group
router.post('/group-members/request-to-join', requestToJoin);

// Get join requests for a group
router.get('/group-members/requests/:groupId', getJoinRequests);

// Accept an invitation or request
router.post('/group-members/accept-invitation', acceptInvitation);

// Decline an invitation
router.post('/group-members/decline-invitation', declineInvitation);

// Reject a join request
router.post('/group-members/reject-request', rejectJoinRequest);

// Get invitations for a user
router.get('/group-members/invitations/:userId', getInvitationsForUser);

// Remove a member from a group
router.post('/group-members/remove-member', removeMember);

// Get requested groups for a user
router.get('/group-members/requested/:userId', getRequestedGroups);

module.exports = router;