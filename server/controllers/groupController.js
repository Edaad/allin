// controllers/groupController.js
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');

// Get groups with optional filters
const getGroups = async (req, res) => {
    try {
        const { admin_id, is_public, userId } = req.query;
        const query = {};

        if (admin_id) {
            query.admin_id = admin_id;
        }

        if (is_public !== undefined) {
            query.is_public = (is_public === 'true');
        }

        const groups = await Group.find(query).populate('admin_id', 'username names');

        // If userId is provided, add membership status to each group
        if (userId) {
            const groupsWithStatus = await Promise.all(groups.map(async (group) => {
                const groupObj = group.toObject();

                // Check if the user has a relationship with this group
                const member = await GroupMember.findOne({
                    user_id: userId,
                    group_id: group._id
                });

                if (member) {
                    groupObj.membershipStatus = member.membership_status;
                    if (member.membership_status === 'rejected' && member.rejection_reason) {
                        groupObj.rejectionReason = member.rejection_reason;
                    }
                } else {
                    groupObj.membershipStatus = 'none';
                }

                return groupObj;
            }));

            return res.json(groupsWithStatus);
        }

        res.json(groups);
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).send(err);
    }
};

// Get a single group by ID
const getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('admin_id', 'username names');
        if (!group) {
            return res.status(404).send({ message: 'Group not found' });
        }
        res.json(group);
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).send(err);
    }
};

// Create a new group
const createGroup = async (req, res) => {
    try {
        console.log('Incoming group creation request:', req.body);

        // Ensure boolean conversion for is_public
        const groupData = {
            ...req.body,
            is_public: req.body.is_public === true
        };

        // Validate group name
        if (!groupData.group_name || groupData.group_name.trim() === '') {
            console.error('Group name is empty or undefined');
            return res.status(400).json({ message: 'Group name is required' });
        }

        // Trim the group name
        groupData.group_name = groupData.group_name.trim();

        const newGroup = new Group(groupData);

        try {
            await newGroup.save();
        } catch (saveError) {
            console.error('Error saving group:', saveError);

            // More detailed error logging
            if (saveError.code === 11000) {
                console.error('Duplicate key error:', saveError.keyValue);
                return res.status(400).json({
                    message: 'A group with this name may already exist',
                    error: saveError.message,
                    details: saveError.keyValue
                });
            }

            return res.status(400).json({
                message: 'Error creating group',
                error: saveError.message
            });
        }

        // Automatically add the creator as an accepted member
        const newMember = new GroupMember({
            user_id: groupData.admin_id,
            group_id: newGroup._id,
            membership_status: 'accepted'
        });

        try {
            await newMember.save();
        } catch (memberSaveError) {
            console.error('Error saving group member:', memberSaveError);
            // Optionally, you might want to delete the group if member save fails
        }

        res.status(201).send(newGroup);
    } catch (err) {
        console.error('Unexpected error in group creation:', err);
        res.status(500).json({
            message: 'Unexpected error occurred',
            error: err.message
        });
    }
};

// Update a group
const updateGroup = async (req, res) => {
    try {
        // Ensure is_public is properly converted
        const updateData = { ...req.body };
        if (updateData.is_public !== undefined) {
            updateData.is_public = updateData.is_public === true;
        }

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedGroup) {
            return res.status(404).send({ message: 'Group not found' });
        }

        res.json(updatedGroup);
    } catch (err) {
        console.error('Error updating group:', err);
        res.status(400).send(err);
    }
};

// Delete a group
const deleteGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) {
            return res.status(404).send({ message: 'Group not found' });
        }

        // Verify the requester is the admin
        if (group.admin_id.toString() !== req.body.userId) {
            return res.status(403).send({ message: 'Only the group admin can delete the group' });
        }

        // Delete associated group members
        await GroupMember.deleteMany({ group_id: group._id });

        // Delete the group
        await Group.findByIdAndDelete(group._id);

        res.json({ message: 'Group and associated members deleted successfully' });
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).send({ message: 'Server error.' });
    }
};

// Get groups for a user with optional status filter
const getGroupsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { membership_status } = req.query;

        // Find all groups where the user is a member
        const memberFilter = { user_id: userId };

        if (membership_status) {
            memberFilter.membership_status = membership_status;
        }

        const userGroups = await GroupMember.find(memberFilter)
            .populate({
                path: 'group_id',
                populate: { path: 'admin_id', select: 'username names' }
            });

        // Extract and transform the groups
        const groups = userGroups.map(membership => {
            const group = membership.group_id.toObject();
            group.membershipStatus = membership.membership_status;
            if (membership.membership_status === 'rejected' && membership.rejection_reason) {
                group.rejectionReason = membership.rejection_reason;
            }
            return group;
        });

        res.status(200).json(groups);
    } catch (err) {
        console.error('Error fetching groups for user:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupsForUser,
};