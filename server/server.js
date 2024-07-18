const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('./utils/hashing');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://admin:admin@allin.xq3ezsf.mongodb.net/poker', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const userSchema = new mongoose.Schema({
    names: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
    },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') || this.isNew) {
        try {
            this.password = await hashPassword(this.password);
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

const User = mongoose.model('User', userSchema);

const gameSchema = new mongoose.Schema({
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_name: { type: String, required: true },
    location: { type: String, required: true },
    game_date: { type: Date, required: true },
    game_status: { type: String, enum: ['upcoming', 'completed'], required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const Game = mongoose.model('Game', gameSchema);

const playerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    buy_in_amount: { type: Number, required: true },
    cash_out_amount: { type: Number, default: 0.00 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const Player = mongoose.model('Player', playerSchema);

app.post('/signin', async (req, res) => {
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

app.get('/users', async (req, res) => {
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
});

app.post('/users', async (req, res) => {
    const { email, username } = req.body;

    try {
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
});

app.get('/games', async (req, res) => {
    try {
        const games = await Game.find({});
        res.json(games);
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).send(err);
    }
});

app.post('/games', async (req, res) => {
    try {
        const newGame = new Game(req.body);
        await newGame.save();
        res.status(201).send(newGame);
    } catch (err) {
        console.error('Error creating game:', err);
        res.status(400).send(err);
    }
});

app.get('/players', async (req, res) => {
    try {
        const players = await Player.find({});
        res.json(players);
    } catch (err) {
        console.error('Error fetching players:', err);
        res.status(500).send(err);
    }
});

app.post('/players', async (req, res) => {
    try {
        const newPlayer = new Player(req.body);
        await newPlayer.save();
        res.status(201).send(newPlayer);
    } catch (err) {
        console.error('Error creating player:', err);
        res.status(400).send(err);
    }
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
