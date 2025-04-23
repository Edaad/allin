const express = require('express');
const router = express.Router();
const { getUsers, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, createUser, signinUser, getUserById, removeFriend, getFriendSuggestions } = require('../controllers/userController');

router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/send-friend-request', sendFriendRequest);
router.post('/accept-friend-request', acceptFriendRequest);
router.post('/reject-friend-request', rejectFriendRequest);
router.post('/cancel-friend-request', cancelFriendRequest);
router.get('/users/:id', getUserById);
router.post('/remove-friend', removeFriend); // Add this line
router.get('/users/:userId/suggestions', getFriendSuggestions);
router.post('/signin', signinUser);

module.exports = router;
