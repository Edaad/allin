const User = require('../models/user');
const { comparePassword } = require('../utils/hashing');

const createUser = async (req, res) => {
    try {
        const { email, username } = req.body;

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).send({ message: 'Account with this email already exists. Please try signing in.' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).send({ message: 'Username already exists. Please choose another username.' });
        }

        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).send(newUser);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(400).send({ message: 'Error creating user', error: err });
    }
};

const getUsers = async (req, res) => {
    const { query } = req.query;
    try {
        let users;
        if (query) {
            const searchRegex = new RegExp(query, 'i');
            users = await User.aggregate([
                {
                    $addFields: {
                        fullName: { $concat: ['$names.firstName', ' ', '$names.lastName'] }
                    }
                },
                {
                    $match: {
                        $or: [
                            { 'names.firstName': searchRegex },
                            { 'names.lastName': searchRegex },
                            { username: searchRegex },
                            { email: searchRegex },
                            { fullName: searchRegex }
                        ]
                    }
                }
            ]);
        } else {
            users = await User.find({});
        }
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send(err);
    }
};

const signinUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
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

module.exports = {
    createUser,
    getUsers,
    signinUser
};
