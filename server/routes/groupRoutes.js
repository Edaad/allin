// routes/groupRoutes.js
const express = require('express');
const router = express.Router();
const {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupsForUser,
} = require('../controllers/groupController');

// Route for fetching groups with optional filters
router.get('/groups', getGroups);

// Route for fetching a single group by ID
router.get('/groups/:id', getGroupById);

// Route for creating a new group
router.post('/groups', createGroup);

// Route for updating a group
router.put('/groups/:id', updateGroup);

// Route for deleting a group
router.delete('/groups/:id', deleteGroup);

// Route for fetching groups for a user
router.get('/groups/user/:userId', getGroupsForUser);

module.exports = router;