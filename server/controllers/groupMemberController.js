// controllers/groupMemberController.js
const GroupMember = require('../models/groupMember');
const Group = require('../models/group');
const User = require('../models/user');

// Get all members of a group
const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        const members = await GroupMember.find({ group_id: groupId })
            .populate('user_id', 'username names email');

        res.json(members);
    } catch (err) {
        console.error('Error fetching group members:', err);
        res.status(500).send(err);
    }
};

// Send group invitations
const sendInvitations = async (req, res) => {
    try {
        const { groupId, adminId, inviteeIds } = req.body;

        // Verify the admin is the group admin
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send({ message: 'Group not found.' });
        }
        if (group.admin_id.toString() !== adminId) {
            return res.status(403).send({ message: 'Only the admin can send invitations.' });
        }

        // Fetch the admin's friends
        const admin = await User.findById(adminId);
        if (!admin) {
            return res.status(404).send({ message: 'Admin not found.' });
        }

        // Filter inviteeIds to only include friends
        const friendsSet = new Set(admin.friends.map(id => id.toString()));
        const validInviteeIds = inviteeIds.filter(id => friendsSet.has(id));

        // Create GroupMember documents with 'pending' status
        const invitations = validInviteeIds.map(inviteeId => ({
            user_id: inviteeId,
            group_id: groupId,
            membership_status: 'pending',
        }));

        // Insert invitations, ignoring duplicates
        await GroupMember.insertMany(invitations, { ordered: false });

        res.status(201).send({ message: 'Invitations sent successfully.' });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key error (invitation already exists)
            return res.status(400).send({ message: 'One or more users have already been invited.' });
        }
        console.error('Error sending invitations:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Cancel a group invitation
const cancelInvitation = async (req, res) => {
    try {
        const { groupId, adminId, inviteeId } = req.body;

        // Verify the admin is the group admin
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).send({ message: 'Group not found.' });
        }
        if (group.admin_id.toString() !== adminId) {
            return res.status(403).send({ message: 'Only the admin can cancel invitations.' });
        }

        // Delete the invitation
        const result = await GroupMember.deleteOne({
            user_id: inviteeId,
            group_id: groupId,
            membership_status: 'pending',
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({ message: 'Invitation not found.' });
        }

        res.status(200).send({ message: 'Invitation canceled successfully.' });
    } catch (err) {
        console.error('Error canceling invitation:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Request to join a group
const requestToJoin = async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        // Check if the group exists and is public
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        if (!group.is_public) {
            return res.status(403).json({ message: 'This group is private. You cannot request to join.' });
        }

        // Check if the user already has a membership record
        const existingMember = await GroupMember.findOne({ user_id: userId, group_id: groupId });
        if (existingMember) {
            return res.status(400).json({
                message: `You have already ${existingMember.membership_status === 'requested' ? 'requested to join' : 'been invited to'} this group.`
            });
        }

        // Create a new member record with status 'requested'
        const newMember = new GroupMember({
            user_id: userId,
            group_id: groupId,
            membership_status: 'requested'
        });

        await newMember.save();

        res.status(201).json({ message: 'Join request sent successfully.' });
    } catch (err) {
        console.error('Error requesting to join group:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Get all join requests for a specific group
const getJoinRequests = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { adminId } = req.query;

        // Verify the requester is the admin
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        if (group.admin_id.toString() !== adminId) {
            return res.status(403).json({ message: 'Only the admin can view join requests.' });
        }

        // Get all members with 'requested' status
        const requests = await GroupMember.find({
            group_id: groupId,
            membership_status: 'requested'
        }).populate('user_id', 'username names email');

        res.status(200).json(requests);
    } catch (err) {
        console.error('Error fetching join requests:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Accept a group invitation or join request
const acceptInvitation = async (req, res) => {
    try {
        const { userId, groupId, requesterId } = req.body;

        // If requesterId is provided, it's an admin accepting a join request
        if (requesterId) {
            // Verify the user is the group admin
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({ message: 'Group not found.' });
            }

            if (group.admin_id.toString() !== userId) {
                return res.status(403).json({ message: 'Only the admin can accept join requests.' });
            }

            // Find the member document
            const member = await GroupMember.findOne({
                user_id: requesterId,
                group_id: groupId,
                membership_status: 'requested'
            });

            if (!member) {
                return res.status(404).json({ message: 'Join request not found.' });
            }

            // Update the membership_status to 'accepted'
            member.membership_status = 'accepted';
            await member.save();

            return res.status(200).json({ message: 'Join request accepted successfully.' });
        }
        // A user is accepting an invitation
        else {
            // Find the member document
            const member = await GroupMember.findOne({ user_id: userId, group_id: groupId });
            if (!member) {
                return res.status(404).json({ message: 'Invitation not found.' });
            }

            // Update the membership_status to 'accepted'
            member.membership_status = 'accepted';
            await member.save();

            return res.status(200).json({ message: 'Invitation accepted successfully.' });
        }
    } catch (err) {
        console.error('Error accepting invitation/request:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Decline a group invitation
const declineInvitation = async (req, res) => {
    try {
        const { userId, groupId } = req.body;

        // Delete the member document
        const result = await GroupMember.deleteOne({ user_id: userId, group_id: groupId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Invitation not found.' });
        }

        res.status(200).json({ message: 'Invitation declined successfully.' });
    } catch (err) {
        console.error('Error declining invitation:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Reject a join request
const rejectJoinRequest = async (req, res) => {
    try {
        const { adminId, groupId, requesterId, reason } = req.body;

        // Verify the admin is the group admin
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        if (group.admin_id.toString() !== adminId) {
            return res.status(403).json({ message: 'Only the admin can reject join requests.' });
        }

        // Find the member document
        const member = await GroupMember.findOne({
            user_id: requesterId,
            group_id: groupId,
            membership_status: 'requested'
        });

        if (!member) {
            return res.status(404).json({ message: 'Join request not found.' });
        }

        // Update status to rejected and add rejection reason
        member.membership_status = 'rejected';
        member.rejection_reason = reason || '';
        await member.save();

        res.status(200).json({ message: 'Join request rejected successfully.' });
    } catch (err) {
        console.error('Error rejecting join request:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Get all invitations for a user
const getInvitationsForUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find all pending invitations for the user
        const invitations = await GroupMember.find({
            user_id: userId,
            membership_status: 'pending'
        }).populate({
            path: 'group_id',
            populate: { path: 'admin_id', select: 'username names' }
        });

        // Extract group details
        const groups = invitations.map(invitation => invitation.group_id);

        res.status(200).json(groups);
    } catch (err) {
        console.error('Error fetching invitations:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Remove a member from a group
const removeMember = async (req, res) => {
    try {
        const { groupId, adminId, memberId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Check if it's the admin removing a member
        const isAdmin = group.admin_id.toString() === adminId;

        // Check if it's a member leaving the group
        const isSelfRemoval = adminId === memberId;

        // Only allow removal if it's the admin removing someone or a member removing themselves
        if (!isAdmin && !isSelfRemoval) {
            return res.status(403).json({
                message: 'You are not authorized to remove this member from the group.'
            });
        }

        // Don't allow admin to be removed
        if (memberId === group.admin_id.toString() && !isSelfRemoval) {
            return res.status(403).json({ message: 'The admin cannot be removed from the group.' });
        }

        const result = await GroupMember.findOneAndDelete({
            group_id: groupId,
            user_id: memberId,
        });

        if (!result) {
            return res.status(404).json({ message: 'Member not found in the group.' });
        }

        res.status(200).json({ message: 'Member removed from the group.' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Get requested groups for a user (requested + rejected)
const getRequestedGroups = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find groups where the user has requested to join or was rejected
        const membershipRecords = await GroupMember.find({
            user_id: userId,
            membership_status: { $in: ['requested', 'rejected'] }
        }).populate({
            path: 'group_id',
            populate: { path: 'admin_id', select: 'username names' }
        });

        // Extract and transform the data
        const groups = membershipRecords.map(record => {
            const group = record.group_id.toObject();
            group.membershipStatus = record.membership_status;
            if (record.membership_status === 'rejected' && record.rejection_reason) {
                group.rejectionReason = record.rejection_reason;
            }
            return group;
        });

        res.status(200).json(groups);
    } catch (err) {
        console.error('Error fetching requested groups:', err);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = {
    getGroupMembers,
    sendInvitations,
    cancelInvitation,
    requestToJoin,
    getJoinRequests,
    acceptInvitation,
    declineInvitation,
    rejectJoinRequest,
    getInvitationsForUser,
    removeMember,
    getRequestedGroups
};