// models/profile.js

const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bio: { type: String, default: '' },
    profile_image: { type: String, default: '' }, // URL or path to profile image
    banner_image: { type: String, default: '' }, // URL or path to banner image
    social_links: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' }
    },
    poker_preferences: {
        preferred_blinds: [{
            type: String,
            enum: ['0.05/0.1', '0.1/0.2', '0.5/1', '1/2', '1/3', '2/5', '5/10']
        }],
        availability: {
            weekdays: { type: Boolean, default: false },
            weeknights: { type: Boolean, default: false },
            weekends: { type: Boolean, default: false }
        }
    },
});

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;