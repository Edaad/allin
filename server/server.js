// server.js

const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Import routes
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const playerRoutes = require('./routes/playerRoutes'); // Ensure this is included
const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI, {
    // Additional options if needed
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Use routes
app.use('/', userRoutes);
app.use('/', gameRoutes);
app.use('/', playerRoutes); // Ensure this is included
app.use('/', authRoutes);

// Start the server
app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
