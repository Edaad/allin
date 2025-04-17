// controllers/userController.js
const userService = require('../services/userService');
const User = require('../models/user');
const Profile = require('../models/profile');
const mongoose = require('mongoose');

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserWithFriends(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error fetching user by ID:', err);
    res.status(500).send(err);
  }
};

const getUsers = async (req, res) => {
  const { query, tab, userId } = req.query;
  try {
    const currentUser = await userService.getUserWithFriends(userId);
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const searchTerms = query && query.length >= 3 ? query.trim().split(/\s+/) : [];
    const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));

    let searchCondition = {};
    if (searchRegexes.length > 0) {
      searchCondition = {
        $and: searchRegexes.map(regex => ({
          $or: [
            { username: regex },
            { 'names.firstName': regex },
            { 'names.lastName': regex }
          ]
        }))
      };
    }

    const currentUserFriendIds = currentUser.friends.map(friend => friend._id.toString());

    let users = [];
    switch (tab) {
      case 'All':
        users = await User.find({ _id: { $ne: userId }, ...searchCondition }).populate('friends', '_id').lean();
        break;
      case 'Friends':
        users = await User.find({ _id: { $in: currentUserFriendIds }, ...searchCondition }).populate('friends', '_id').lean();
        break;
      case 'PendingRequests': {
        const pendingIds = currentUser.pendingRequests.map(id => id._id.toString());
        users = await User.find({ _id: { $in: pendingIds }, ...searchCondition }).populate('friends', '_id').lean();
        break;
      }
      case 'Invitations': {
        const inviteIds = currentUser.friendRequests.map(id => id._id.toString());
        users = await User.find({ _id: { $in: inviteIds }, ...searchCondition }).populate('friends', '_id').lean();
        break;
      }
      default:
        users = [];
    }

    const usersWithMutualFriends = users.map(userItem => {
      const userItemFriendIds = userItem.friends.map(friend => friend._id.toString());
      const mutualFriends = currentUserFriendIds.filter(id => userItemFriendIds.includes(id));
      return {
        ...userItem,
        mutualFriendsCount: mutualFriends.length
      };
    });

    res.json(usersWithMutualFriends);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).send(err);
  }
};

const createUser = async (req, res) => {
  try {
    const user = await userService.createUserWithProfile(req.body);
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(400).json({ message: err.message });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    await userService.handleFriendRequest(req.body.userId, req.body.friendId);
    res.status(200).send({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(400).send({ message: err.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    await userService.acceptFriend(req.body.userId, req.body.friendId);
    res.status(200).send({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error accepting friend request:', err);
    res.status(500).send({ message: 'Server error' });
  }
};

const rejectFriendRequest = async (req, res) => {
  try {
    await userService.rejectFriend(req.body.userId, req.body.friendId);
    res.status(200).send({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Error rejecting friend request:', err);
    res.status(500).send({ message: 'Server error' });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    await userService.cancelFriend(req.body.userId, req.body.friendId);
    res.status(200).send({ message: 'Friend request canceled' });
  } catch (err) {
    console.error('Error canceling friend request:', err);
    res.status(500).send({ message: 'Server error' });
  }
};

const signinUser = async (req, res) => {
  try {
    const user = await userService.signin(req.body.email, req.body.password);
    res.status(200).send({ message: 'Sign-in successful', user });
  } catch (err) {
    console.error('Sign-in error:', err);
    res.status(400).send({ message: err.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    await userService.removeFriendConnection(req.body.userId, req.body.friendId);
    res.status(200).send({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).send({ message: 'Server error' });
  }
};

/**
 * Get friend suggestions for a user based on friends of friends
 */
const getFriendSuggestions = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Fetch the user with their friends
        const user = await User.findById(userId).populate('friends');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get IDs of user's current friends
        const friendIds = user.friends.map(friend => friend._id.toString());
        
        // Also exclude pending requests and received requests
        const pendingRequestIds = user.pendingRequests.map(req => 
            typeof req === 'string' ? req : req._id.toString()
        );
        const receivedRequestIds = user.friendRequests.map(req => 
            typeof req === 'string' ? req : req._id.toString()
        );
        
        // Create a set of all excluded IDs (user's own ID, friends, and pending/received requests)
        const excludedIds = new Set([
            user._id.toString(),
            ...friendIds,
            ...pendingRequestIds,
            ...receivedRequestIds
        ]);
        
        // Collect friends of friends
        let potentialSuggestions = new Map(); // Map to track potential suggestions and mutual friend count
        
        // For each friend, get their friends
        for (const friend of user.friends) {
            // Fetch friend's friends
            const friendWithTheirFriends = await User.findById(friend._id).populate('friends');
            
            if (friendWithTheirFriends && friendWithTheirFriends.friends.length > 0) {
                // For each friend of friend
                for (const friendOfFriend of friendWithTheirFriends.friends) {
                    const fofId = friendOfFriend._id.toString();
                    
                    // Skip if this is the user themselves, already a friend, or in pending requests
                    if (excludedIds.has(fofId)) {
                        continue;
                    }
                    
                    // Increment mutual friend count or initialize to 1
                    if (potentialSuggestions.has(fofId)) {
                        potentialSuggestions.set(fofId, {
                            user: friendOfFriend,
                            mutualCount: potentialSuggestions.get(fofId).mutualCount + 1,
                            mutualFriends: [...potentialSuggestions.get(fofId).mutualFriends, friend]
                        });
                    } else {
                        potentialSuggestions.set(fofId, {
                            user: friendOfFriend,
                            mutualCount: 1,
                            mutualFriends: [friend]
                        });
                    }
                }
            }
        }
        
        // Convert map to array and sort by mutual friend count (descending)
        const suggestions = Array.from(potentialSuggestions.values())
            .sort((a, b) => b.mutualCount - a.mutualCount)
            .map(suggestion => {
                const { user: suggestionUser, mutualCount, mutualFriends } = suggestion;
                
                // Format the response
                return {
                    _id: suggestionUser._id,
                    username: suggestionUser.username,
                    names: suggestionUser.names,
                    email: suggestionUser.email,
                    mutualFriendsCount: mutualCount,
                    mutualFriends: mutualFriends.map(friend => ({
                        _id: friend._id,
                        username: friend.username
                    })).slice(0, 3) // Limit to first 3 mutual friends
                };
            })
            .slice(0, 10); // Limit to top 10 suggestions
        
        res.status(200).json(suggestions);
    } catch (err) {
        console.error('Error getting friend suggestions:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
  getUsers,
  createUser,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  signinUser,
  getUserById,
  removeFriend,
  getFriendSuggestions
};
