// controllers/profileController.js

const profileService = require('../services/profileService');

/**
 * Get a user's profile
 */
const getProfile = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Use service to get profile with games
    const profileWithGames = await profileService.getProfileWithGames(profileId);
    res.status(200).json(profileWithGames);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Create a new profile for a user
 */
const createProfile = async (req, res) => {
  try {
    console.log('Creating profile with data:', req.body);
    const { user_id } = req.body;

    if (!user_id) {
      console.error('Missing user_id in request body');
      return res.status(400).json({ message: 'user_id is required' });
    }

    // Prepare profile data with defaults
    const profileData = {
      user_id,
      bio: req.body.bio || '',
      profile_image: req.body.profile_image || '',
      banner_image: req.body.banner_image || '',
      social_links: {
        facebook: req.body.social_links?.facebook || '',
        twitter: req.body.social_links?.twitter || '',
        instagram: req.body.social_links?.instagram || '',
        linkedin: req.body.social_links?.linkedin || ''
      },
      poker_preferences: {
        preferred_blinds: req.body.poker_preferences?.preferred_blinds || ['0.5/1'],
        availability: {
          weekdays: req.body.poker_preferences?.availability?.weekdays || false,
          weeknights: req.body.poker_preferences?.availability?.weeknights || false,
          weekends: req.body.poker_preferences?.availability?.weekends || true
        }
      }
    };

    console.log('Creating profile with processed data:', profileData);
    const savedProfile = await profileService.createNewProfile(profileData);
    console.log('Profile created successfully:', savedProfile);

    res.status(201).json(savedProfile);
  } catch (err) {
    console.error('Error creating profile:', err);

    // More specific error response
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Profile validation failed',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    if (err.code === 11000 || err.status === 400) {
      return res.status(400).json({ message: err.message || 'Profile already exists for this user' });
    }

    res.status(err.status || 500).json({ message: err.message || 'Server error creating profile' });
  }
};

/**
 * Update a user's profile
 */
const updateProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { userId } = req.body;

    // Remove user_id from update data to prevent it from being changed
    const updateData = { ...req.body };
    delete updateData.user_id;
    delete updateData.userId;

    const updatedProfile = await profileService.updateProfileData(profileId, userId, updateData);
    res.status(200).json(updatedProfile);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Update profile or banner image
 */
const updateImage = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { imageUrl, type, userId } = req.body;

    const profile = await profileService.updateProfileImage(profileId, userId, imageUrl, type);

    res.status(200).json({
      message: `${type === 'profile' ? 'Profile' : 'Banner'} image updated`,
      profile
    });
  } catch (err) {
    console.error('Error updating image:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Update poker preferences
 */
const updatePokerPreferences = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { poker_preferences, userId } = req.body;

    const profile = await profileService.updatePokerPreferences(profileId, userId, poker_preferences);

    res.status(200).json({ message: 'Poker preferences updated', profile });
  } catch (err) {
    console.error('Error updating poker preferences:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Update social links
 */
const updateSocialLinks = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { social_links, userId } = req.body;

    const profile = await profileService.updateSocialLinks(profileId, userId, social_links);

    res.status(200).json({ message: 'Social links updated', profile });
  } catch (err) {
    console.error('Error updating social links:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

/**
 * Get profile by user ID
 */
const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching profile for user ID:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const profileWithGames = await profileService.getProfileWithGames(userId);
    console.log('Profile found for user ID:', userId);

    res.status(200).json(profileWithGames);
  } catch (err) {
    console.error('Error fetching profile by user ID:', err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  updateImage,
  updatePokerPreferences,
  updateSocialLinks,
  getProfileByUserId
};