// controllers/groupMemberController.js
const groupMemberService = require('../services/groupMemberService');

const getGroupMembers = async (req, res) => {
  try {
    const members = await groupMemberService.getGroupMembers(req.params.groupId);
    res.json(members);
  } catch (err) {
    console.error('Error fetching group members:', err);
    res.status(500).send(err);
  }
};

const sendInvitations = async (req, res) => {
  try {
    const { groupId, adminId, inviteeIds } = req.body;
    const result = await groupMemberService.sendInvitations(groupId, adminId, inviteeIds);
    res.status(201).send({ message: `Sent ${result.count} invitations successfully.` });
  } catch (err) {
    console.error('Error sending invitations:', err);
    res.status(400).send({ message: err.message });
  }
};

const cancelInvitation = async (req, res) => {
  try {
    const { groupId, adminId, inviteeId } = req.body;
    await groupMemberService.cancelInvitation(groupId, adminId, inviteeId);
    res.status(200).send({ message: 'Invitation canceled successfully.' });
  } catch (err) {
    console.error('Error canceling invitation:', err);
    res.status(400).send({ message: err.message });
  }
};

const requestToJoin = async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    await groupMemberService.requestToJoin(userId, groupId);
    res.status(201).send({ message: 'Join request sent successfully.' });
  } catch (err) {
    console.error('Error requesting to join group:', err);
    res.status(400).send({ message: err.message });
  }
};

const getJoinRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.query;
    const requests = await groupMemberService.getJoinRequests(groupId, adminId);
    res.status(200).json(requests);
  } catch (err) {
    console.error('Error fetching join requests:', err);
    res.status(400).send({ message: err.message });
  }
};

const acceptInvitation = async (req, res) => {
  try {
    await groupMemberService.acceptInvitation(req.body);
    res.status(200).send({ message: 'Accepted successfully.' });
  } catch (err) {
    console.error('Error accepting invitation/request:', err);
    res.status(400).send({ message: err.message });
  }
};

const declineInvitation = async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    await groupMemberService.declineInvitation(userId, groupId);
    res.status(200).send({ message: 'Invitation declined successfully.' });
  } catch (err) {
    console.error('Error declining invitation:', err);
    res.status(400).send({ message: err.message });
  }
};

const rejectJoinRequest = async (req, res) => {
  try {
    const { adminId, groupId, requesterId, reason } = req.body;
    await groupMemberService.rejectJoinRequest(adminId, groupId, requesterId, reason);
    res.status(200).send({ message: 'Join request rejected successfully.' });
  } catch (err) {
    console.error('Error rejecting join request:', err);
    res.status(400).send({ message: err.message });
  }
};

const getInvitationsForUser = async (req, res) => {
  try {
    const groups = await groupMemberService.getInvitationsForUser(req.params.userId);
    res.status(200).json(groups);
  } catch (err) {
    console.error('Error fetching invitations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { groupId, adminId, memberId } = req.body;
    await groupMemberService.removeMember(groupId, adminId, memberId);
    res.status(200).send({ message: 'Member removed from the group.' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(400).json({ message: err.message });
  }
};

const getRequestedGroups = async (req, res) => {
  try {
    const groups = await groupMemberService.getRequestedGroups(req.params.userId);
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