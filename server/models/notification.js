// models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        required: true,
        enum: [
            // Game-related notifications
            'game_created', 'game_join_request', 'game_join_accepted', 'game_join_rejected',
            'game_invitation_received', 'game_invitation_sent', 'game_invitation_accepted',
            'game_invitation_declined', 'game_edited', 'game_deleted', 'player_removed',
            'player_left', 'friend_new_game', 'game_starting_soon',

            // Group-related notifications
            'group_created', 'group_join_request', 'group_join_accepted', 'group_join_rejected',
            'group_invitation_received', 'group_invitation_sent', 'group_invitation_accepted',
            'group_invitation_declined', 'group_edited', 'group_deleted', 'member_removed',
            'member_left', 'friend_new_group',

            // Friend-related notifications
            'friend_request_received', 'friend_request_accepted', 'friend_request_declined',
            'friend_removed'
        ]
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenced_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenced_model'
    },
    referenced_model: {
        type: String,
        enum: ['Game', 'Group', 'User', 'Player', 'GroupMember']
    },
    link: { type: String }, // Optional URL to navigate to
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

// Index for faster querying
notificationSchema.index({ user_id: 1, read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ referenced_id: 1, type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;