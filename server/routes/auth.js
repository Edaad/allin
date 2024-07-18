const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { comparePassword } = require('../utils/hashing');

router.post('/', async (req, res) => {
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
});

module.exports = router;
