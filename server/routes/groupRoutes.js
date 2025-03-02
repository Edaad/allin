// routes/groupRoutes.js

const express = require('express');
const router = express.Router();
const { 
        createGroup, 
        joinGroup,
        getGroupDetails,
        getGroupsForUser
      } = require('../controllers/groupController');

// Create a new group
router.post('/groups', createGroup);

// Join a group
router.post('/groups/:groupId/join', joinGroup);

// Get group details
router.get('/groups/:groupId', getGroupDetails);

// Get groups for a user
router.get('/groups/:userId/groups', getGroupsForUser);

module.exports = router;


