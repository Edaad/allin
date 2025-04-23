const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Import routes
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const playerRoutes = require('./routes/playerRoutes');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const groupMemberRoutes = require('./routes/groupMemberRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const guestProfileRoutes = require('./routes/guestProfileRoutes');

// Enhanced CORS configuration
app.use(cors({
	origin: ['https://all-in-4ce60.web.app', 'http://localhost:3000'],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
	optionsSuccessStatus: 204
}));

// Explicit handling for OPTIONS requests
app.options('*', cors());

// Body parsing middleware - place it AFTER CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGO_URI)
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch((err) => {
		console.error('Error connecting to MongoDB:', err);
	});

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'Server is running' });
});

// Use routes
app.use('/', userRoutes);
app.use('/', gameRoutes);
app.use('/', playerRoutes);
app.use('/', authRoutes);
app.use('/', groupRoutes);
app.use('/', groupMemberRoutes);
app.use('/', notificationRoutes);
app.use('/', profileRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', guestProfileRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log(`Server running in ${process.env.NODE_ENV || 'production'} mode`);
});