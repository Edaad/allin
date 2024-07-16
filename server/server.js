const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable all CORS requests
app.use(express.json()); // Middleware to parse JSON requests

mongoose.connect('mongodb+srv://admin:admin@allin.xq3ezsf.mongodb.net/poker', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Define Schemas
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const gameSchema = new mongoose.Schema({
    host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_name: { type: String, required: true },
    location: { type: String, required: true },
    game_date: { type: Date, required: true },
    game_status: { type: String, enum: ['upcoming', 'completed'], required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const playerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    buy_in_amount: { type: Number, required: true },
    cash_out_amount: { type: Number, default: 0.00 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// Define Models
const User = mongoose.model('User', userSchema);
const Game = mongoose.model('Game', gameSchema);
const Player = mongoose.model('Player', playerSchema);

// Route for Sign In
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email, password });
        if (user) {
            res.status(200).send({ message: 'Sign-in successful', user });
        } else {
            res.status(400).send({ message: 'Invalid email or password' });
        }
    } catch (err) {
        res.status(500).send({ message: 'Server error', error: err });
    }
});

// Routes for Users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).send(newUser);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Routes for Games
app.get('/games', async (req, res) => {
    try {
        const games = await Game.find({});
        res.json(games);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/games', async (req, res) => {
    try {
        const newGame = new Game(req.body);
        await newGame.save();
        res.status(201).send(newGame);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Routes for Players
app.get('/players', async (req, res) => {
    try {
        const players = await Player.find({});
        res.json(players);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.post('/players', async (req, res) => {
    try {
        const newPlayer = new Player(req.body);
        await newPlayer.save();
        res.status(201).send(newPlayer);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});