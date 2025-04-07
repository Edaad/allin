// controllers/profileController.js

const Profile = require('../models/profile');
const User = require('../models/user');
const Game = require('../models/game');

/**
 * Get a user's profile
 */

/**
 * 
 * testing to see if i can make a change
 */

const getProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        
        // Find the profile
        const profile = await Profile.findOne({ user_id: profileId }).populate('user_id', 'username names email');
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        // Get hosted games if available
        try {
            const hostedGames = await Game.find({ host_id: profileId })
                .select('game_name game_date location game_status blinds handed')
                .sort({ game_date: -1 });
            
            // Add game history to the response
            const responseProfile = profile.toObject();
            responseProfile.hostedGames = hostedGames;
            
            res.status(200).json(responseProfile);
        } catch (gameErr) {
            console.error('Error fetching hosted games:', gameErr);
            // Return the profile without games if there's an error
            res.status(200).json(profile);
        }
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
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
        
        //Check if user exists
        const user = await User.findById(user_id);
        if (!user) {
            console.error('User not found for user_id:', user_id);
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Create new profile with default values if not provided
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
        const newProfile = new Profile(profileData);
        
        const savedProfile = await newProfile.save();
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
        res.status(500).json({ 
            message: 'Server error creating profile', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};


/**
 * Update a user's profile
 */
const updateProfile = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { userId } = req.body; // For security check
        
        // Security check - ensure the user is updating their own profile
        const profile = await Profile.findOne({ user_id: profileId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        if (profile.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
        // Remove user_id from update data to prevent it from being changed
        const updateData = { ...req.body };
        delete updateData.user_id;
        delete updateData.userId;
        
        // Update profile
        const updatedProfile = await Profile.findOneAndUpdate(
            { user_id: profileId },
            updateData,
            { new: true }
        );
        
        res.status(200).json(updatedProfile);
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update profile or banner image
 */
const updateImage = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { imageUrl, type, userId } = req.body;
        
        // Security check
        const profile = await Profile.findOne({ user_id: profileId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        if (profile.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
        // Determine which image to update
        if (type === 'profile') {
            profile.profile_image = imageUrl;
        } else if (type === 'banner') {
            profile.banner_image = imageUrl;
        } else {
            return res.status(400).json({ message: 'Invalid image type. Must be "profile" or "banner".' });
        }
        
        await profile.save();
        
        res.status(200).json({ 
            message: `${type === 'profile' ? 'Profile' : 'Banner'} image updated`,
            profile 
        });
    } catch (err) {
        console.error('Error updating image:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update poker preferences
 */
const updatePokerPreferences = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { poker_preferences, userId } = req.body;
        
        // Security check
        const profile = await Profile.findOne({ user_id: profileId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        if (profile.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
        // Update poker preferences
        profile.poker_preferences = {
            ...profile.poker_preferences,
            ...poker_preferences
        };
        
        await profile.save();
        
        res.status(200).json({ message: 'Poker preferences updated', profile });
    } catch (err) {
        console.error('Error updating poker preferences:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update social links
 */
const updateSocialLinks = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { social_links, userId } = req.body;
        
        // Security check
        const profile = await Profile.findOne({ user_id: profileId });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        if (profile.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
        // Update social links
        profile.social_links = {
            ...profile.social_links,
            ...social_links
        };
        
        await profile.save();
        
        res.status(200).json({ message: 'Social links updated', profile });
    } catch (err) {
        console.error('Error updating social links:', err);
        res.status(500).json({ message: 'Server error' });
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
        
        const profile = await Profile.findOne({ user_id: userId })
            .populate('user_id', 'username names email');
        
        if (!profile) {
            console.log('No profile found for user ID:', userId);
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        console.log('Profile found for user ID:', userId);
        
        // Get hosted games if available
        try {
            const hostedGames = await Game.find({ host_id: userId })
                .select('game_name game_date location game_status blinds handed')
                .sort({ game_date: -1 });
            
            // Add game history to the response
            const responseProfile = profile.toObject();
            responseProfile.hostedGames = hostedGames;
            
            res.status(200).json(responseProfile);
        } catch (gameErr) {
            console.error('Error fetching hosted games:', gameErr);
            // Return the profile without games if there's an error
            res.status(200).json(profile);
        }
    } catch (err) {
        console.error('Error fetching profile by user ID:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
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