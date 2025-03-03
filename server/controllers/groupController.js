// controllers/groupController.js
const Group = require('../models/group');
const User = require('../models/user');

// Create a new group
exports.createGroup = async (req, res) => {
    const { name, description, userId} = req.body; 
    try {
        // Check if the group name already exists
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) {
            return res.status(400).json({ error: 'Group name already exists' });
        }

        // Create the group
        const group = new Group({
            name,
            description,
            creator: userId,
            members: [userId] // Add the creator as a member
        });

        await group.save();

        // Add the group to the creator's list of groups
        await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

        res.status(201).json({
            groupId: group._id,
            name: group.name,
            creator: group.creator,
            members: group.members
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
};

exports.joinGroup = async (req, res) => {
    const groupId = req.params.groupId;
    const { userId } = req.body; // Get userId from the request body

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check if the user is already a member
        if (group.members.includes(userId)) {
            return res.status(400).json({ error: 'User is already a member' });
        }

        // Add the user to the group's members list
        group.members.push(userId);
        await group.save();

        // Add the group to the user's list of groups
        await User.findByIdAndUpdate(userId, { $push: { groups: group._id } });

        res.status(200).json({
            groupId: group._id,
            message: 'Successfully joined the group'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join group' });
    }
};

// Get group details
exports.getGroupDetails = async (req, res) => {
    const groupId = req.params.groupId;

    try {
        const group = await Group.findById(groupId)
            .populate('creator', 'username names email') // Populate creator details
            .populate('members', 'username names email'); // Populate member details

        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.status(200).json({
            groupId: group._id,
            name: group.name,
            creator: group.creator,
            members: group.members,
            description: group.description,
            created_at: group.created_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch group details' });
    }
};

// Get groups for a user
exports.getGroupsForUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId).populate('groups', 'name description creator members');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user.groups);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user groups' });
    }
};