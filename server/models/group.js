// models/group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group_name: { type: String, required: true },
    description: { type: String, default: '' },
    banner_image: { type: String, default: '' }, // URL or path to banner image
    profile_image: { type: String, default: '' }, // URL or path to profile image
    is_public: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Index for faster querying
groupSchema.index({ admin_id: 1 });
groupSchema.index({ is_public: 1 });
groupSchema.index({ group_name: 1, admin_id: 1 }, { unique: true });

// Middleware to remove related group members when a group is deleted
groupSchema.pre('remove', async function (next) {
    try {
        const GroupMember = mongoose.model('GroupMember');
        await GroupMember.deleteMany({ group_id: this._id });
        next();
    } catch (err) {
        console.error('Error in pre-remove middleware:', err);
        next(err);
    }
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;