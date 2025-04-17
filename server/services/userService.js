// services/userService.js
const User = require('../models/user');
const Profile = require('../models/profile');
const { hashPassword, comparePassword } = require('../utils/hashing');
const notificationService = require('../services/notificationService');

const getUserWithFriends = async (userId) => {
  return await User.findById(userId)
    .populate('friends', 'username names email')
    .populate('pendingRequests', 'username names email')
    .populate('friendRequests', 'username names email')
    .lean();
};

const createUserWithProfile = async ({ email, username, names, password }) => {
  const existingEmail = await User.findOne({ email });
  if (existingEmail) throw new Error('Account with this email already exists. Please try signing in.');

  const existingUsername = await User.findOne({ username });
  if (existingUsername) throw new Error('Username already exists. Please choose another username.');

  const newUser = new User({ email, username, names, password });
  const savedUser = await newUser.save();

  try {
    const newProfile = new Profile({ user_id: savedUser._id });
    await newProfile.save();
    console.log(`Created minimal profile for user ${savedUser.username}`);
  } catch (err) {
    console.error('Error creating profile for new user:', err);
  }

  return savedUser;
};

const handleFriendRequest = async (userId, friendId, type) => {
  if (userId === friendId) throw new Error('Cannot send friend request to yourself.');

  const user = await User.findById(userId).lean();
  if (user.friends.includes(friendId)) throw new Error('You are already friends with this user.');
  if (user.pendingRequests.includes(friendId)) throw new Error('Friend request already sent.');

  await User.findByIdAndUpdate(friendId, { $addToSet: { friendRequests: userId } });
  await User.findByIdAndUpdate(userId, { $addToSet: { pendingRequests: friendId } });

  try {
    await notificationService.notifyFriendRequestReceived(friendId, userId);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const acceptFriend = async (userId, friendId) => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { friends: friendId },
    $pull: { friendRequests: friendId }
  });
  await User.findByIdAndUpdate(friendId, {
    $addToSet: { friends: userId },
    $pull: { pendingRequests: userId }
  });

  try {
    await notificationService.notifyFriendRequestAccepted(friendId, userId);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const rejectFriend = async (userId, friendId) => {
  await User.findByIdAndUpdate(userId, { $pull: { friendRequests: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { pendingRequests: userId } });

  try {
    await notificationService.notifyFriendRequestDeclined(friendId, userId);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

const cancelFriend = async (userId, friendId) => {
  await User.findByIdAndUpdate(userId, { $pull: { pendingRequests: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friendRequests: userId } });
};

const signin = async (email, password) => {
  const user = await User.findOne({ email })
    .populate('friends', 'username names email')
    .populate('pendingRequests', 'username names email')
    .populate('friendRequests', 'username names email');

  if (user && await comparePassword(password, user.password)) {
    return user;
  } else {
    throw new Error('Invalid email or password');
  }
};

const removeFriendConnection = async (userId, friendId) => {
  await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

  try {
    await notificationService.notifyFriendRemoved(friendId, userId);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

module.exports = {
  getUserWithFriends,
  createUserWithProfile,
  handleFriendRequest,
  acceptFriend,
  rejectFriend,
  cancelFriend,
  signin,
  removeFriendConnection
};
