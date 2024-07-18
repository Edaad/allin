const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://admin:admin@allin.xq3ezsf.mongodb.net/poker', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const playerRoutes = require('./routes/players');

// Use routes
app.use('/signin', authRoutes);
app.use('/users', userRoutes);
app.use('/games', gameRoutes);
app.use('/players', playerRoutes);

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
