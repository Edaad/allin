// services/notificationService.js
const Notification = require("../models/notification");
const User = require("../models/user");
const Game = require("../models/game");
const Group = require("../models/group");

/**
 * Create a new notification
 * @param {Object} notification - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (notification) => {
  try {
    const newNotification = new Notification(notification);
    await newNotification.save();
    return newNotification;
  } catch (err) {
    console.error("Error creating notification:", err);
    throw err;
  }
};

/**
 * Notify a user about a game creation
 */
const notifyGameCreated = async (userId, gameId) => {
  return;
};

/**
 * Notify a host about a join request
 */
const notifyGameJoinRequest = async (hostId, playerId, gameId) => {
  try {
    const [game, player] = await Promise.all([
      Game.findById(gameId),
      User.findById(playerId),
    ]);

    if (!game || !player) {
      console.error("Game or player not found:", { gameId, playerId });
      return;
    }

    // Create and save the notification directly
    const notification = new Notification({
      user_id: hostId,
      type: "game_join_request",
      title: "New Join Request",
      message: `${player.username} has requested to join your game: ${game.game_name}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${hostId}/host/game/${gameId}`,
      read: false,
      created_at: new Date()
    });

    await notification.save();
    console.log("Game join request notification created:", notification._id);

    return notification;
  } catch (err) {
    console.error("Error in notifyGameJoinRequest:", err);
  }
};

/**
 * Notify a player that their join request was accepted
 */
const notifyGameJoinAccepted = async (playerId, hostId, gameId) => {
  try {
    const [game, host] = await Promise.all([
      Game.findById(gameId),
      User.findById(hostId),
    ]);

    if (!game || !host) return;

    await createNotification({
      user_id: playerId,
      type: "game_join_accepted",
      title: "Join Request Accepted",
      message: `Your request to join ${game.game_name} has been accepted by ${host.username}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${playerId}/games/game/${gameId}`,
    });
  } catch (err) {
    console.error("Error in notifyGameJoinAccepted:", err);
  }
};

/**
 * Notify a player that their join request was rejected
 */
const notifyGameJoinRejected = async (playerId, hostId, gameId, reason) => {
  try {
    const [game, host] = await Promise.all([
      Game.findById(gameId),
      User.findById(hostId),
    ]);

    if (!game || !host) return;

    await createNotification({
      user_id: playerId,
      type: "game_join_rejected",
      title: "Join Request Declined",
      message: `Your request to join ${game.game_name
        } was declined. Reason: ${reason || "No reason provided"}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${playerId}/games`,
    });
  } catch (err) {
    console.error("Error in notifyGameJoinRejected:", err);
  }
};

/**
 * Notify a player about a game invitation
 */
const notifyGameInvitationReceived = async (playerId, hostId, gameId) => {
  try {
    const [game, host] = await Promise.all([
      Game.findById(gameId),
      User.findById(hostId),
    ]);

    if (!game || !host) return;

    await createNotification({
      user_id: playerId,
      type: "game_invitation_received",
      title: "Game Invitation",
      message: `${host.username} has invited you to join their game: ${game.game_name}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${playerId}/games`,
    });
  } catch (err) {
    console.error("Error in notifyGameInvitationReceived:", err);
  }
};

/**
 * Notify a host that they have sent invitations
 */
const notifyGameInvitationSent = async (hostId, inviteeCount, gameId) => {
  return;
};

/**
 * Notify a host that a player accepted an invitation
 */
const notifyGameInvitationAccepted = async (hostId, playerId, gameId) => {
  try {
    const [game, player] = await Promise.all([
      Game.findById(gameId),
      User.findById(playerId),
    ]);

    if (!game || !player) return;

    await createNotification({
      user_id: hostId,
      type: "game_invitation_accepted",
      title: "Invitation Accepted",
      message: `${player.username} has accepted your invitation to ${game.game_name}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${hostId}/host/game/${gameId}`,
    });
  } catch (err) {
    console.error("Error in notifyGameInvitationAccepted:", err);
  }
};

/**
 * Notify a host that a player declined an invitation
 */
const notifyGameInvitationDeclined = async (hostId, playerId, gameId) => {
  try {
    const [game, player] = await Promise.all([
      Game.findById(gameId),
      User.findById(playerId),
    ]);

    if (!game || !player) return;

    await createNotification({
      user_id: hostId,
      type: "game_invitation_declined",
      title: "Invitation Declined",
      message: `${player.username} has declined your invitation to ${game.game_name}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${hostId}/host/game/${gameId}`,
    });
  } catch (err) {
    console.error("Error in notifyGameInvitationDeclined:", err);
  }
};

/**
 * Notify players that a game has been updated
 */
const notifyGameEdited = async (gameId) => {
  try {
    const game = await Game.findById(gameId);
    if (!game) return;

    // Only notify players
    const Player = require("../models/player");
    const players = await Player.find({
      game_id: gameId,
      invitation_status: "accepted",
    });

    // Create a notification for each player
    await Promise.all(
      players.map((player) =>
        createNotification({
          user_id: player.user_id,
          type: "game_edited",
          title: "Game Updated",
          message: `Details for ${game.game_name} have been updated`,
          referenced_id: gameId,
          referenced_model: "Game",
          link: `/dashboard/${player.user_id}/games/game/${gameId}`,
        })
      )
    );
  } catch (err) {
    console.error("Error in notifyGameEdited:", err);
  }
};

/**
 * Notify players that a game has been deleted
 */
const notifyGameDeleted = async (gameId, gameName, players, hostId) => {
  try {
    // Create a notification for each player
    await Promise.all(
      players.map((playerId) =>
        createNotification({
          user_id: playerId,
          type: "game_deleted",
          title: "Game Cancelled",
          message: `Game "${gameName}" has been cancelled by the host`,
          referenced_id: playerId,
          referenced_model: "User",
          link: `/dashboard/${playerId}/games`,
        })
      )
    );
  } catch (err) {
    console.error("Error in notifyGameDeleted:", err);
  }
};

/**
 * Notify a player that they've been removed from a game
 */
const notifyPlayerRemoved = async (playerId, hostId, gameId) => {
  try {
    const [game, host] = await Promise.all([
      Game.findById(gameId),
      User.findById(hostId),
    ]);

    if (!game || !host) return;

    await createNotification({
      user_id: playerId,
      type: "player_removed",
      title: "Removed from Game",
      message: `You've been removed from ${game.game_name} by the host`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${playerId}/games`,
    });
  } catch (err) {
    console.error("Error in notifyPlayerRemoved:", err);
  }
};

/**
 * Notify a host that a player left
 */
const notifyPlayerLeft = async (hostId, playerId, gameId) => {
  try {
    const [game, player] = await Promise.all([
      Game.findById(gameId),
      User.findById(playerId),
    ]);

    if (!game || !player) return;

    await createNotification({
      user_id: hostId,
      type: "player_left",
      title: "Player Left Game",
      message: `${player.username} has left your game: ${game.game_name}`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${hostId}/host/game/${gameId}`,
    });
  } catch (err) {
    console.error("Error in notifyPlayerLeft:", err);
  }
};

/**
 * Notify a user about a friend's new game
 */
const notifyFriendNewGame = async (userId, friendId, gameId) => {
  try {
    const [game, friend] = await Promise.all([
      Game.findById(gameId),
      User.findById(friendId),
    ]);

    if (!game || !friend) return;

    await createNotification({
      user_id: userId,
      type: "friend_new_game",
      title: "Friend Hosting a Game",
      message: `Your friend ${friend.username} is hosting a new game: ${game.game_name}. Join now!`,
      referenced_id: gameId,
      referenced_model: "Game",
      link: `/dashboard/${userId}/games`,
    });
  } catch (err) {
    console.error("Error in notifyFriendNewGame:", err);
  }
};

/**
 * Notify players that a game is starting soon
 */
const notifyGameStartingSoon = async (gameId) => {
  try {
    const game = await Game.findById(gameId);
    if (!game) return;

    // Get all accepted players for this game
    const Player = require("../models/player");
    const players = await Player.find({
      game_id: gameId,
      invitation_status: "accepted",
    });

    // Create a notification for each player
    await Promise.all(
      players.map((player) =>
        createNotification({
          user_id: player.user_id,
          type: "game_starting_soon",
          title: "Game Starting Soon",
          message: `Reminder: Your game ${game.game_name} starts in 24 hours`,
          referenced_id: gameId,
          referenced_model: "Game",
          link: `/dashboard/${player.user_id}/games/game/${gameId}`,
        })
      )
    );
  } catch (err) {
    console.error("Error in notifyGameStartingSoon:", err);
  }
};

// GROUP NOTIFICATIONS

/**
 * Notify a user about a group creation
 */
const notifyGroupCreated = async (userId, groupId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    await createNotification({
      user_id: userId,
      type: "group_created",
      title: "Group Created",
      message: `You've successfully created a new group: ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupCreated:", err);
  }
};

/**
 * Notify an admin about a join request
 */
const notifyGroupJoinRequest = async (adminId, userId, groupId) => {
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group || !user) return;

    await createNotification({
      user_id: adminId,
      type: "group_join_request",
      title: "New Group Join Request",
      message: `${user.username} has requested to join your group: ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${adminId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupJoinRequest:", err);
  }
};

/**
 * Notify a user that their join request was accepted
 */
const notifyGroupJoinAccepted = async (userId, adminId, groupId) => {
  try {
    const [group, admin] = await Promise.all([
      Group.findById(groupId),
      User.findById(adminId),
    ]);

    if (!group || !admin) return;

    await createNotification({
      user_id: userId,
      type: "group_join_accepted",
      title: "Group Join Request Accepted",
      message: `Your request to join ${group.group_name} has been accepted by ${admin.username}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupJoinAccepted:", err);
  }
};

/**
 * Notify a user that their join request was rejected
 */
const notifyGroupJoinRejected = async (userId, adminId, groupId, reason) => {
  try {
    const [group, admin] = await Promise.all([
      Group.findById(groupId),
      User.findById(adminId),
    ]);

    if (!group || !admin) return;

    await createNotification({
      user_id: userId,
      type: "group_join_rejected",
      title: "Group Join Request Declined",
      message: `Your request to join ${group.group_name
        } was declined. Reason: ${reason || "No reason provided"}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/community`,
    });
  } catch (err) {
    console.error("Error in notifyGroupJoinRejected:", err);
  }
};

/**
 * Notify a user about a group invitation
 */
const notifyGroupInvitationReceived = async (userId, adminId, groupId) => {
  try {
    const [group, admin] = await Promise.all([
      Group.findById(groupId),
      User.findById(adminId),
    ]);

    if (!group || !admin) return;

    await createNotification({
      user_id: userId,
      type: "group_invitation_received",
      title: "Group Invitation",
      message: `${admin.username} has invited you to join their group: ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/community`,
    });
  } catch (err) {
    console.error("Error in notifyGroupInvitationReceived:", err);
  }
};

/**
 * Notify an admin that they have sent invitations
 */
const notifyGroupInvitationSent = async (adminId, inviteeCount, groupId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    await createNotification({
      user_id: adminId,
      type: "group_invitation_sent",
      title: "Group Invitations Sent",
      message: `You've invited ${inviteeCount} user${inviteeCount !== 1 ? "s" : ""
        } to join your group: ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${adminId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupInvitationSent:", err);
  }
};

/**
 * Notify an admin that a user accepted an invitation
 */
const notifyGroupInvitationAccepted = async (adminId, userId, groupId) => {
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group || !user) return;

    await createNotification({
      user_id: adminId,
      type: "group_invitation_accepted",
      title: "Group Invitation Accepted",
      message: `${user.username} has accepted your invitation to ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${adminId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupInvitationAccepted:", err);
  }
};

/**
 * Notify an admin that a user declined an invitation
 */
const notifyGroupInvitationDeclined = async (adminId, userId, groupId) => {
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group || !user) return;

    await createNotification({
      user_id: adminId,
      type: "group_invitation_declined",
      title: "Group Invitation Declined",
      message: `${user.username} has declined your invitation to ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${adminId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyGroupInvitationDeclined:", err);
  }
};

/**
 * Notify members that a group has been updated
 */
const notifyGroupEdited = async (groupId) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    // Get all accepted members for this group
    const GroupMember = require("../models/groupMember");
    const members = await GroupMember.find({
      group_id: groupId,
      membership_status: "accepted",
    });

    // Create a notification for each member
    await Promise.all(
      members.map((member) =>
        createNotification({
          user_id: member.user_id,
          type: "group_edited",
          title: "Group Updated",
          message: `Details for ${group.group_name} have been updated`,
          referenced_id: groupId,
          referenced_model: "Group",
          link: `/dashboard/${member.user_id}/groups/${groupId}`,
        })
      )
    );
  } catch (err) {
    console.error("Error in notifyGroupEdited:", err);
  }
};

/**
 * Notify members that a group has been deleted
 */
const notifyGroupDeleted = async (groupId, groupName, members) => {
  try {
    // Create a notification for each member
    await Promise.all(
      members.map((memberId) =>
        createNotification({
          user_id: memberId,
          type: "group_deleted",
          title: "Group Deleted",
          message: `Group "${groupName}" has been deleted by the admin`,
          referenced_id: memberId, // Reference the member since group no longer exists
          referenced_model: "User",
          link: `/dashboard/${memberId}/community`,
        })
      )
    );
  } catch (err) {
    console.error("Error in notifyGroupDeleted:", err);
  }
};

/**
 * Notify a member that they've been removed from a group
 */
const notifyMemberRemoved = async (userId, adminId, groupId) => {
  try {
    const [group, admin] = await Promise.all([
      Group.findById(groupId),
      User.findById(adminId),
    ]);

    if (!group || !admin) return;

    await createNotification({
      user_id: userId,
      type: "member_removed",
      title: "Removed from Group",
      message: `You've been removed from ${group.group_name} by the admin`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/community`,
    });
  } catch (err) {
    console.error("Error in notifyMemberRemoved:", err);
  }
};

/**
 * Notify an admin that a member left
 */
const notifyMemberLeft = async (adminId, userId, groupId) => {
  try {
    const [group, user] = await Promise.all([
      Group.findById(groupId),
      User.findById(userId),
    ]);

    if (!group || !user) return;

    await createNotification({
      user_id: adminId,
      type: "member_left",
      title: "Member Left Group",
      message: `${user.username} has left your group: ${group.group_name}`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${adminId}/groups/${groupId}`,
    });
  } catch (err) {
    console.error("Error in notifyMemberLeft:", err);
  }
};

/**
 * Notify a user about a friend's new group
 */
const notifyFriendNewGroup = async (userId, friendId, groupId) => {
  try {
    const [group, friend] = await Promise.all([
      Group.findById(groupId),
      User.findById(friendId),
    ]);

    if (!group || !friend) return;

    await createNotification({
      user_id: userId,
      type: "friend_new_group",
      title: "Friend Created a Group",
      message: `Your friend ${friend.username} created a new group: ${group.group_name}. Check it out!`,
      referenced_id: groupId,
      referenced_model: "Group",
      link: `/dashboard/${userId}/community`,
    });
  } catch (err) {
    console.error("Error in notifyFriendNewGroup:", err);
  }
};

// FRIEND NOTIFICATIONS

/**
 * Notify a user about a received friend request
 */
const notifyFriendRequestReceived = async (userId, requesterId) => {
  try {
    const requester = await User.findById(requesterId);
    if (!requester) return;

    await createNotification({
      user_id: userId,
      type: "friend_request_received",
      title: "New Friend Request",
      message: `${requester.username} sent you a friend request`,
      referenced_id: requesterId,
      referenced_model: "User",
      link: `/dashboard/${userId}/friends`,
    });
  } catch (err) {
    console.error("Error in notifyFriendRequestReceived:", err);
  }
};

/**
 * Notify a user that their friend request was accepted
 */
const notifyFriendRequestAccepted = async (userId, accepterId) => {
  try {
    const accepter = await User.findById(accepterId);
    if (!accepter) return;

    await createNotification({
      user_id: userId,
      type: "friend_request_accepted",
      title: "Friend Request Accepted",
      message: `${accepter.username} accepted your friend request`,
      referenced_id: accepterId,
      referenced_model: "User",
      link: `/dashboard/${userId}/friends`,
    });
  } catch (err) {
    console.error("Error in notifyFriendRequestAccepted:", err);
  }
};

/**
 * Notify a user that their friend request was declined
 */
const notifyFriendRequestDeclined = async (userId, declinerId) => {
  try {
    const decliner = await User.findById(declinerId);
    if (!decliner) return;

    await createNotification({
      user_id: userId,
      type: "friend_request_declined",
      title: "Friend Request Declined",
      message: `Your friend request to ${decliner.username} was declined`,
      referenced_id: declinerId,
      referenced_model: "User",
      link: `/dashboard/${userId}/friends`,
    });
  } catch (err) {
    console.error("Error in notifyFriendRequestDeclined:", err);
  }
};

/**
 * Notify a user that they were removed as a friend
 */
const notifyFriendRemoved = async (userId, removerId) => {
  try {
    const remover = await User.findById(removerId);
    if (!remover) return;

    await createNotification({
      user_id: userId,
      type: "friend_removed",
      title: "Friend Removed",
      message: `${remover.username} has removed you as a friend`,
      referenced_id: removerId,
      referenced_model: "User",
      link: `/dashboard/${userId}/friends`,
    });
  } catch (err) {
    console.error("Error in notifyFriendRemoved:", err);
  }
};

// Export all notification functions
module.exports = {
  // Game notifications
  notifyGameCreated,
  notifyGameJoinRequest,
  notifyGameJoinAccepted,
  notifyGameJoinRejected,
  notifyGameInvitationReceived,
  notifyGameInvitationSent,
  notifyGameInvitationAccepted,
  notifyGameInvitationDeclined,
  notifyGameEdited,
  notifyGameDeleted,
  notifyPlayerRemoved,
  notifyPlayerLeft,
  notifyFriendNewGame,
  notifyGameStartingSoon,

  // Group notifications
  notifyGroupCreated,
  notifyGroupJoinRequest,
  notifyGroupJoinAccepted,
  notifyGroupJoinRejected,
  notifyGroupInvitationReceived,
  notifyGroupInvitationSent,
  notifyGroupInvitationAccepted,
  notifyGroupInvitationDeclined,
  notifyGroupEdited,
  notifyGroupDeleted,
  notifyMemberRemoved,
  notifyMemberLeft,
  notifyFriendNewGroup,

  // Friend notifications
  notifyFriendRequestReceived,
  notifyFriendRequestAccepted,
  notifyFriendRequestDeclined,
  notifyFriendRemoved,
};