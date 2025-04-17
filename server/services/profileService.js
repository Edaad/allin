// services/profileService.js

const Profile = require('../models/profile');
const User = require('../models/user');
const Game = require('../models/game');

/**
 * Get profile by ID
 */
const getProfileById = async (profileId) => {
  const profile = await Profile.findOne({ user_id: profileId }).populate('user_id', 'username names email');
  if (!profile) {
    throw { status: 404, message: 'Profile not found' };
  }
  return profile;
};

/**
 * Get hosted games for a profile
 */
const getHostedGames = async (profileId) => {
  try {
    return await Game.find({ host_id: profileId })
      .select('game_name game_date location game_status blinds handed')
      .sort({ game_date: -1 });
  } catch (error) {
    console.error('Error fetching hosted games:', error);
    return [];
  }
};

/**
 * Check if profile exists
 */
const checkProfileExists = async (userId) => {
  const profile = await Profile.findOne({ user_id: userId });
  return profile !== null;
};

/**
 * Create a new profile
 */
const createNewProfile = async (profileData) => {
  // Check if profile already exists
  const existing = await checkProfileExists(profileData.user_id);
  if (existing) {
    throw { status: 400, message: 'Profile already exists for this user' };
  }
  
  // Create new profile
  const newProfile = new Profile(profileData);
  return await newProfile.save();
};

/**
 * Update profile data
 */
const updateProfileData = async (profileId, userId, updateData) => {
  // Get profile for security check
  const profile = await Profile.findOne({ user_id: profileId });
  if (!profile) {
    throw { status: 404, message: 'Profile not found' };
  }
  
  // Security check
  if (profile.user_id.toString() !== userId) {
    throw { status: 403, message: 'Not authorized to update this profile' };
  }
  
  // Update profile
  return await Profile.findOneAndUpdate(
    { user_id: profileId },
    updateData,
    { new: true }
  );
};

/**
 * Update profile or banner image
 */
const updateProfileImage = async (profileId, userId, imageUrl, type) => {
  // Get profile for security check
  const profile = await Profile.findOne({ user_id: profileId });
  if (!profile) {
    throw { status: 404, message: 'Profile not found' };
  }
  
  // Security check
  if (profile.user_id.toString() !== userId) {
    throw { status: 403, message: 'Not authorized to update this profile' };
  }
  
  // Validate image type
  if (type !== 'profile' && type !== 'banner') {
    throw { status: 400, message: 'Invalid image type. Must be "profile" or "banner".' };
  }
  
  // Update appropriate field
  if (type === 'profile') {
    profile.profile_image = imageUrl;
  } else {
    profile.banner_image = imageUrl;
  }
  
  await profile.save();
  return profile;
};

/**
 * Update poker preferences
 */
const updatePokerPreferences = async (profileId, userId, preferences) => {
  const profile = await Profile.findOne({ user_id: profileId });
  if (!profile) {
    throw { status: 404, message: 'Profile not found' };
  }
  
  if (profile.user_id.toString() !== userId) {
    throw { status: 403, message: 'Not authorized to update this profile' };
  }
  
  profile.poker_preferences = {
    ...profile.poker_preferences,
    ...preferences
  };
  
  await profile.save();
  return profile;
};

/**
 * Update social links
 */
const updateSocialLinks = async (profileId, userId, socialLinks) => {
  const profile = await Profile.findOne({ user_id: profileId });
  if (!profile) {
    throw { status: 404, message: 'Profile not found' };
  }
  
  if (profile.user_id.toString() !== userId) {
    throw { status: 403, message: 'Not authorized to update this profile' };
  }
  
  profile.social_links = {
    ...profile.social_links,
    ...socialLinks
  };
  
  await profile.save();
  return profile;
};

/**
 * Get profile with hosted games
 */
const getProfileWithGames = async (profileId) => {
  const profile = await getProfileById(profileId);
  const hostedGames = await getHostedGames(profileId);
  
  const responseProfile = profile.toObject();
  responseProfile.hostedGames = hostedGames;
  
  return responseProfile;
};

module.exports = {
  getProfileById,
  getHostedGames,
  checkProfileExists,
  createNewProfile,
  updateProfileData,
  updateProfileImage,
  updatePokerPreferences,
  updateSocialLinks,
  getProfileWithGames
};