// routes/profileRoutes.js

const express = require('express');
const router = express.Router();
const {
    getProfile,
    createProfile,
    updateProfile,
    updateImage,
    updatePokerPreferences,
    updateSocialLinks,
    getProfileByUserId
} = require('../controllers/profileController');

// Get a profile by user ID
router.get('/profiles/user/:userId', getProfileByUserId);

// Get a profile by profile ID
router.get('/profiles/:profileId', getProfile);

// Create a new profile
router.post('/profiles', createProfile);

// Update a profile
router.put('/profiles/:profileId', updateProfile);

// Update profile or banner image
router.patch('/profiles/:profileId/image', updateImage);

// Update poker preferences
router.patch('/profiles/:profileId/preferences', updatePokerPreferences);

// Update social links
router.patch('/profiles/:profileId/social', updateSocialLinks);



router.post('/profiles', (req, res, next) => {
    console.log('Received profile creation request:', req.body);
    next();
}, createProfile);


module.exports = router;