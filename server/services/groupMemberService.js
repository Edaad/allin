// services/groupMemberService.js
const GroupMember = require('../models/groupMember');
const Group = require('../models/group');
const User = require('../models/user');
const notificationService = require('../services/notificationService');

const getGroupMembers = async (groupId) => {
  return await GroupMember.find({ group_id: groupId })
    .populate('user_id', 'username names email');
};

const sendInvitations = async (groupId, adminId, inviteeIds) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');
  if (group.admin_id.toString() !== adminId) throw new Error('Only the admin can send invitations.');

  const admin = await User.findById(adminId);
  if (!admin) throw new Error('Admin not found.');

  const friendsSet = new Set(admin.friends.map(id => id.toString()));
  const validInviteeIds = inviteeIds.filter(id => friendsSet.has(id));

  const invitations = validInviteeIds.map(inviteeId => ({
    user_id: inviteeId,
    group_id: groupId,
    membership_status: 'pending'
  }));

  await GroupMember.insertMany(invitations, { ordered: false });

  for (const inviteeId of validInviteeIds) {
    await notificationService.notifyGroupInvitationReceived(inviteeId, adminId, groupId);
  }
  await notificationService.notifyGroupInvitationSent(adminId, validInviteeIds.length, groupId);

  return { count: validInviteeIds.length };
};

const cancelInvitation = async (groupId, adminId, inviteeId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');
  if (group.admin_id.toString() !== adminId) throw new Error('Only the admin can cancel invitations.');

  const result = await GroupMember.deleteOne({
    user_id: inviteeId,
    group_id: groupId,
    membership_status: 'pending'
  });
  if (result.deletedCount === 0) throw new Error('Invitation not found.');
};

const requestToJoin = async (userId, groupId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');
  if (!group.is_public) throw new Error('This group is private. You cannot request to join.');

  const existingMember = await GroupMember.findOne({ user_id: userId, group_id: groupId });
  if (existingMember) throw new Error('You already have a membership record with this group.');

  const newMember = new GroupMember({
    user_id: userId,
    group_id: groupId,
    membership_status: 'requested'
  });
  await newMember.save();

  await notificationService.notifyGroupJoinRequest(group.admin_id, userId, groupId);
};

const getJoinRequests = async (groupId, adminId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');
  if (group.admin_id.toString() !== adminId) throw new Error('Only the admin can view join requests.');

  return await GroupMember.find({
    group_id: groupId,
    membership_status: 'requested'
  }).populate('user_id', 'username names email');
};

const acceptInvitation = async ({ userId, groupId, requesterId }) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');

  if (requesterId) {
    if (group.admin_id.toString() !== userId) throw new Error('Only the admin can accept join requests.');

    const member = await GroupMember.findOne({
      user_id: requesterId,
      group_id: groupId,
      membership_status: 'requested'
    });
    if (!member) throw new Error('Join request not found.');

    member.membership_status = 'accepted';
    await member.save();
    await notificationService.notifyGroupJoinAccepted(requesterId, userId, groupId);
  } else {
    const member = await GroupMember.findOne({ user_id: userId, group_id: groupId });
    if (!member) throw new Error('Invitation not found.');

    member.membership_status = 'accepted';
    await member.save();
    await notificationService.notifyGroupInvitationAccepted(group.admin_id, userId, groupId);
  }
};

const declineInvitation = async (userId, groupId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');

  const member = await GroupMember.findOne({ user_id: userId, group_id: groupId });
  if (!member) throw new Error('Invitation not found.');

  await GroupMember.deleteOne({ user_id: userId, group_id: groupId });
  await notificationService.notifyGroupInvitationDeclined(group.admin_id, userId, groupId);
};

const rejectJoinRequest = async (adminId, groupId, requesterId, reason = '') => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');
  if (group.admin_id.toString() !== adminId) throw new Error('Only the admin can reject join requests.');

  const member = await GroupMember.findOne({
    user_id: requesterId,
    group_id: groupId,
    membership_status: 'requested'
  });
  if (!member) throw new Error('Join request not found.');

  member.membership_status = 'rejected';
  member.rejection_reason = reason;
  await member.save();
  await notificationService.notifyGroupJoinRejected(requesterId, adminId, groupId, reason);
};

const getInvitationsForUser = async (userId) => {
  const invitations = await GroupMember.find({
    user_id: userId,
    membership_status: 'pending'
  }).populate({
    path: 'group_id',
    populate: { path: 'admin_id', select: 'username names' }
  });
  return invitations.map(invite => invite.group_id);
};

const removeMember = async (groupId, adminId, memberId) => {
  const group = await Group.findById(groupId);
  if (!group) throw new Error('Group not found.');

  const isAdmin = group.admin_id.toString() === adminId;
  const isSelf = adminId === memberId;

  if (!isAdmin && !isSelf) throw new Error('Unauthorized to remove this member.');
  if (memberId === group.admin_id.toString() && !isSelf) throw new Error('Cannot remove group admin.');

  const result = await GroupMember.findOneAndDelete({ group_id: groupId, user_id: memberId });
  if (!result) throw new Error('Member not found in the group.');

  if (isAdmin && !isSelf) {
    await notificationService.notifyMemberRemoved(memberId, adminId, groupId);
  } else if (isSelf) {
    await notificationService.notifyMemberLeft(group.admin_id, memberId, groupId);
  }
};

const getRequestedGroups = async (userId) => {
  const records = await GroupMember.find({
    user_id: userId,
    membership_status: { $in: ['requested', 'rejected'] }
  }).populate({
    path: 'group_id',
    populate: { path: 'admin_id', select: 'username names' }
  });

  return records.map(record => {
    const group = record.group_id.toObject();
    group.membershipStatus = record.membership_status;
    if (record.membership_status === 'rejected' && record.rejection_reason) {
      group.rejectionReason = record.rejection_reason;
    }
    return group;
  });
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
