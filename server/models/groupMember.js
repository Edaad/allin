// models/groupMember.js
const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    membership_status: {
        type: String,
        enum: ['pending', 'accepted', 'requested', 'rejected'],
        default: 'pending'
    },
    rejection_reason: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Ensure a user is a member of a group only once
groupMemberSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

const GroupMember = mongoose.model('GroupMember', groupMemberSchema);
module.exports = GroupMember;