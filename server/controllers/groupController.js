// controllers/groupController.js
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const notificationService = require('../services/notificationService');
const groupService = require('../services/groupService');

const getGroups = async (req, res) => {
  try {
    const result = await groupService.getGroupsWithMembershipStatus(req.query);
    res.json(result);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).send(err);
  }
};

const getGroupById = async (req, res) => {
  try {
    const group = await groupService.getGroupDetails(req.params.id);
    if (!group) {
      return res.status(404).send({ message: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    console.error('Error fetching group:', err);
    res.status(500).send(err);
  }
};

const createGroup = async (req, res) => {
  try {
    const newGroup = await groupService.createGroupWithAdmin(req.body);
    res.status(201).send(newGroup);
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(400).send(err);
  }
};

const updateGroup = async (req, res) => {
  try {
    const updatedGroup = await groupService.updateGroupInfo(req.params.id, req.body);
    if (!updatedGroup) {
      return res.status(404).send({ message: 'Group not found' });
    }
    res.json(updatedGroup);
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(400).send(err);
  }
};

const deleteGroup = async (req, res) => {
  try {
    const result = await groupService.deleteGroupWithNotifications(req.params.id, req.body.userId);
    if (result.status === 403) {
      return res.status(403).send({ message: result.message });
    }
    if (result.status === 404) {
      return res.status(404).send({ message: result.message });
    }
    res.json({ message: result.message });
  } catch (err) {
    console.error('Error deleting group:', err);
    res.status(500).send({ message: 'Server error.' });
  }
};

const getGroupsForUser = async (req, res) => {
  try {
    const result = await groupService.getGroupsByUser(req.params.userId, req.query.membership_status);
    res.status(200).json(result);
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
