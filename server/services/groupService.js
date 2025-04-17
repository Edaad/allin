// services/groupService.js
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const notificationService = require('../services/notificationService');

const getGroupsWithMembershipStatus = async ({ admin_id, is_public, userId }) => {
  const query = {};
  if (admin_id) query.admin_id = admin_id;
  if (is_public !== undefined) query.is_public = is_public === 'true';

  const groups = await Group.find(query).populate('admin_id', 'username names');

  if (!userId) return groups;

  const groupsWithStatus = await Promise.all(groups.map(async (group) => {
    const groupObj = group.toObject();
    const member = await GroupMember.findOne({ user_id: userId, group_id: group._id });

    groupObj.membershipStatus = member ? member.membership_status : 'none';
    if (member?.membership_status === 'rejected' && member.rejection_reason) {
      groupObj.rejectionReason = member.rejection_reason;
    }

    return groupObj;
  }));

  return groupsWithStatus;
};

const getGroupDetails = async (groupId) => {
  return await Group.findById(groupId).populate('admin_id', 'username names');
};

const createGroupWithAdmin = async (groupData) => {
  const groupPayload = { ...groupData, is_public: groupData.is_public === true };
  const newGroup = new Group(groupPayload);
  await newGroup.save();

  const newMember = new GroupMember({
    user_id: groupData.admin_id,
    group_id: newGroup._id,
    membership_status: 'accepted'
  });
  await newMember.save();

  try {
    await notificationService.notifyGroupCreated(groupData.admin_id, newGroup._id);
  } catch (err) {
    console.error("Error creating notification:", err);
  }

  return newGroup;
};

const updateGroupInfo = async (groupId, updateData) => {
  if (updateData.is_public !== undefined) {
    updateData.is_public = updateData.is_public === true;
  }

  const updatedGroup = await Group.findByIdAndUpdate(groupId, updateData, { new: true });

  if (updatedGroup) {
    try {
      await notificationService.notifyGroupEdited(updatedGroup._id);
    } catch (err) {
      console.error("Error creating notifications:", err);
    }
  }

  return updatedGroup;
};

const deleteGroupWithNotifications = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  if (!group) return { status: 404, message: 'Group not found' };
  if (group.admin_id.toString() !== userId) return { status: 403, message: 'Only the group admin can delete the group' };

  const members = await GroupMember.find({
    group_id: group._id,
    user_id: { $ne: userId },
    membership_status: 'accepted'
  });
  const memberIds = members.map(m => m.user_id);

  await GroupMember.deleteMany({ group_id: group._id });
  await Group.findByIdAndDelete(group._id);

  try {
    await notificationService.notifyGroupDeleted(group._id, group.group_name, memberIds);
  } catch (err) {
    console.error("Error creating notifications:", err);
  }

  return { status: 200, message: 'Group and associated members deleted successfully' };
};

const getGroupsByUser = async (userId, statusFilter) => {
    const filter = { user_id: userId };
    if (statusFilter) filter.membership_status = statusFilter;
  
    const memberships = await GroupMember.find(filter).populate({
      path: 'group_id',
      populate: { path: 'admin_id', select: 'username names' }
    });
  
    return memberships.map(record => {
      const group = record.group_id.toObject();
      group.membershipStatus = record.membership_status;
      if (record.membership_status === 'rejected' && record.rejection_reason) {
        group.rejectionReason = record.rejection_reason;
      }
      return group;
    });
  };


module.exports = {
  getGroupsWithMembershipStatus,
  getGroupDetails,
  createGroupWithAdmin,
  updateGroupInfo,
  deleteGroupWithNotifications,
  getGroupsByUser
};
