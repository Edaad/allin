// routes/groupRoutes.js

const express = require('express');
const router = express.Router();
const { 
        createGroup, 
        joinGroup,
        getGroupDetails,
      } = require('../controllers/groupController');


// Create a new group
router.post('/groups', createGroup);

// Join a group
router.post('/groups/:groupId/join', joinGroup);

// Get group details
router.get('/groups/:groupId', getGroupDetails);



module.exports = router;


