// controllers/userController.js

const User = require('../models/user');
const { hashPassword, comparePassword } = require('../utils/hashing');
const notificationService = require('../services/notificationService');

/**
 * Fetches a user by ID and populates friends, pendingRequests, and friendRequests.
 * @param {String} userId - The ID of the user to fetch.
 * @returns {Object} - The populated user object.
 */
const getUserWithFriends = async (userId) => {
    try {
        const user = await User.findById(userId)
            .populate('friends', 'username names email') // Populate friends with necessary fields
            .populate('pendingRequests', 'username names email') // Populate pendingRequests
            .populate('friendRequests', 'username names email') // Populate friendRequests
            .lean(); // Convert to plain JavaScript object for performance
        return user;
    } catch (err) {
        console.error('Error in getUserWithFriends:', err);
        throw err;
    }
};

/**
 * Retrieves a user by their ID.
 */
const getUserById = async (req, res) => {
    try {
        const user = await getUserWithFriends(req.params.id);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching user by ID:', err);
        res.status(500).send(err);
    }
};

/**
 * Fetches users based on query parameters, handling different tabs.
 */
const getUsers = async (req, res) => {
    const { query, tab, userId } = req.query;
    try {
        let users = [];
        const user = await getUserWithFriends(userId);

        console.log(`Fetching users for tab: ${tab}, query: ${query}, userId: ${userId}`);

        // Parse and create search regexes if query is valid
        const searchTerms = query && query.length >= 3 ? query.trim().split(/\s+/) : [];
        const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));

        // Build the search condition
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

        // Convert ObjectIds to strings for comparison
        const currentUserFriendIds = user.friends.map(friend => friend._id.toString());

        switch (tab) {
            case 'All':
                users = await User.find({
                    _id: { $ne: userId },
                    ...searchCondition
                })
                    .populate('friends', '_id')
                    .lean();
                break;

            case 'Friends':
                users = await User.find({
                    _id: { $in: currentUserFriendIds },
                    ...searchCondition
                })
                    .populate('friends', '_id')
                    .lean();
                break;

            case 'PendingRequests':
                const pendingRequestIds = user.pendingRequests.map(id => id._id.toString());
                users = await User.find({
                    _id: { $in: pendingRequestIds },
                    ...searchCondition
                })
                    .populate('friends', '_id')
                    .lean();
                break;

            case 'Invitations':
                const friendRequestIds = user.friendRequests.map(id => id._id.toString());
                users = await User.find({
                    _id: { $in: friendRequestIds },
                    ...searchCondition
                })
                    .populate('friends', '_id')
                    .lean();
                break;

            default:
                users = [];
                break;
        }

        console.log('Current User Friend IDs:', currentUserFriendIds);

        // Compute mutual friends
        const usersWithMutualFriends = users.map(userItem => {
            const userItemFriendIds = userItem.friends.map(friend => friend._id.toString());
            const mutualFriends = currentUserFriendIds.filter(id => userItemFriendIds.includes(id));
            const mutualFriendsCount = mutualFriends.length;

            console.log(`User: ${userItem.username}, Mutual Friends Count: ${mutualFriendsCount}`);

            return {
                ...userItem,
                mutualFriendsCount
            };
        });

        res.json(usersWithMutualFriends);

    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send(err);
    }
};

/**
 * Creates a new user.
 */
const createUser = async (req, res) => {
    const { email, username, names, password } = req.body;
    try {
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Account with this email already exists. Please try signing in.' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists. Please choose another username.' });
        }

        const newUser = new User({ email, username, names, password });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Error creating user', error: err.message });
    }
};

/**
 * Sends a friend request from userId to friendId.
 */
const sendFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // Prevent sending a friend request to oneself
        if (userId === friendId) {
            return res.status(400).send({ message: 'Cannot send friend request to yourself.' });
        }

        // Check if already friends
        const user = await User.findById(userId).lean();
        if (user.friends.includes(friendId)) {
            return res.status(400).send({ message: 'You are already friends with this user.' });
        }

        // Check if a friend request is already pending
        if (user.pendingRequests.includes(friendId)) {
            return res.status(400).send({ message: 'Friend request already sent.' });
        }

        await User.findByIdAndUpdate(friendId, { $addToSet: { friendRequests: userId } });
        await User.findByIdAndUpdate(userId, { $addToSet: { pendingRequests: friendId } });

        // Send notification to the recipient of the friend request
        try {
            await notificationService.notifyFriendRequestReceived(friendId, userId);
            console.log("Friend request notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

        res.status(200).send({ message: 'Friend request sent' });
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

/**
 * Accepts a friend request.
 */
const acceptFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // Update both users' friends lists
        await User.findByIdAndUpdate(userId, {
            $addToSet: { friends: friendId },
            $pull: { friendRequests: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $addToSet: { friends: userId },
            $pull: { pendingRequests: userId }
        });

        // Send notification to the person who sent the friend request
        try {
            await notificationService.notifyFriendRequestAccepted(friendId, userId);
            console.log("Friend request accepted notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

        res.status(200).send({ message: 'Friend request accepted' });
    } catch (err) {
        console.error('Error accepting friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

/**
 * Rejects a friend request.
 */
const rejectFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // Remove the friend request from both users
        await User.findByIdAndUpdate(userId, { $pull: { friendRequests: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { pendingRequests: userId } });

        // Send notification to the person who sent the friend request
        try {
            await notificationService.notifyFriendRequestDeclined(friendId, userId);
            console.log("Friend request declined notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

        res.status(200).send({ message: 'Friend request rejected' });
    } catch (err) {
        console.error('Error rejecting friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

/**
 * Cancels a sent friend request.
 */
const cancelFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        // Remove the pending request from both users
        await User.findByIdAndUpdate(userId, { $pull: { pendingRequests: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friendRequests: userId } });
        res.status(200).send({ message: 'Friend request canceled' });
    } catch (err) {
        console.error('Error canceling friend request:', err);
        res.status(500).send({ message: 'Friend request canceled', error: err });
    }
};

/**
 * Signs in a user.
 */
const signinUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email })
            .populate('friends', 'username names email')
            .populate('pendingRequests', 'username names email')
            .populate('friendRequests', 'username names email');
        if (user && await comparePassword(password, user.password)) {
            res.status(200).send({ message: 'Sign-in successful', user });
        } else {
            res.status(400).send({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error('Error during sign-in:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

/**
 * Removes a friend from both users' friends lists.
 */
const removeFriend = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        // Notify the user that they have been removed as a friend
        try {
            await notificationService.notifyFriendRemoved(friendId, userId);
            console.log("Friend removed notification sent");
        } catch (notificationError) {
            console.error("Error creating notification:", notificationError);
            // Continue execution even if notification fails
        }

        res.status(200).send({ message: 'Friend removed successfully' });
    } catch (err) {
        console.error('Error removing friend:', err);
        res.status(500).send({ message: 'Server error', error: err });
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
    removeFriend
};