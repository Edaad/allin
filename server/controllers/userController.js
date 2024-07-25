const User = require('../models/user');
const { hashPassword, comparePassword } = require('../utils/hashing');

const getUserWithFriends = async (userId) => {
    try {
        const user = await User.findById(userId)
            .populate('friends', 'username names email')
            .populate('pendingRequests', 'username names email')
            .populate('friendRequests', 'username names email');
        console.log('getUserWithFriends - user:', user);
        return user;
    } catch (err) {
        console.error('Error in getUserWithFriends:', err);
        throw err;
    }
};

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

const getUsers = async (req, res) => {
    const { query, tab, userId } = req.query;
    try {
        let users;
        const searchRegex = query ? new RegExp(query, 'i') : null;
        const user = await getUserWithFriends(userId);

        console.log(`Fetching users for tab: ${tab}, query: ${query}, userId: ${userId}`);
        console.log('User:', user);

        switch (tab) {
            case 'Friends':
                users = user.friends.filter(u => searchRegex ? u.username.match(searchRegex) || u.names.firstName.match(searchRegex) || u.names.lastName.match(searchRegex) : true);
                break;
            case 'PendingRequests':
                users = user.pendingRequests.filter(u => searchRegex ? u.username.match(searchRegex) || u.names.firstName.match(searchRegex) || u.names.lastName.match(searchRegex) : true);
                break;
            case 'Invitations':
                users = user.friendRequests.filter(u => searchRegex ? u.username.match(searchRegex) || u.names.firstName.match(searchRegex) || u.names.lastName.match(searchRegex) : true);
                break;
            default:
                users = await User.find({
                    _id: { $ne: userId },
                    ...(searchRegex && {
                        $or: [
                            { username: searchRegex },
                            { 'names.firstName': searchRegex },
                            { 'names.lastName': searchRegex }
                        ]
                    })
                });
                break;
        }

        console.log('Users fetched:', users);
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send(err);
    }
};

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

const sendFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(friendId, { $addToSet: { friendRequests: userId } });
        await User.findByIdAndUpdate(userId, { $addToSet: { pendingRequests: friendId } });
        res.status(200).send({ message: 'Friend request sent' });
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

const acceptFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId }, $pull: { friendRequests: friendId } });
        await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId }, $pull: { pendingRequests: userId } });
        res.status(200).send({ message: 'Friend request accepted' });
    } catch (err) {
        console.error('Error accepting friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

const rejectFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { $pull: { friendRequests: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { pendingRequests: userId } });
        res.status(200).send({ message: 'Friend request rejected' });
    } catch (err) {
        console.error('Error rejecting friend request:', err);
        res.status(500).send({ message: 'Server error', error: err });
    }
};

const cancelFriendRequest = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { $pull: { pendingRequests: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friendRequests: userId } });
        res.status(200).send({ message: 'Friend request canceled' });
    } catch (err) {
        console.error('Error canceling friend request:', err);
        res.status(500).send({ message: 'Friend request canceled', error: err });
    }
};

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


const removeFriend = async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
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
    removeFriend // Add this line
};