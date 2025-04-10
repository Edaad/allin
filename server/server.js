// // server.js
// const express = require('express');
// require('dotenv').config();
// const mongoose = require('mongoose');
// const cors = require('cors');
// const app = express();

// // Import routes
// const userRoutes = require('./routes/userRoutes');
// const gameRoutes = require('./routes/gameRoutes');
// const playerRoutes = require('./routes/playerRoutes');
// const authRoutes = require('./routes/authRoutes');
// const groupRoutes = require('./routes/groupRoutes');
// const groupMemberRoutes = require('./routes/groupMemberRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const profileRoutes = require('./routes/profileRoutes');
// const reviewRoutes = require('./routes/reviewRoutes');
// const guestProfileRoutes = require('./routes/guestProfileRoutes');

// // CORS should be one of the first middleware
// // This helps ensure that CORS headers are properly set before processing requests
// app.use(cors({
//     origin: ['https://all-in-4ce60.web.app', 'http://localhost:3000'],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
//     exposedHeaders: ['Content-Range', 'X-Content-Range'],
//     maxAge: 600, // Cache preflight requests for 10 minutes
//     preflightContinue: false,
//     optionsSuccessStatus: 204
// }));

// // Handle OPTIONS requests explicitly
// app.options('*', cors());

// // Parse JSON bodies
// app.use(express.json());

// // Middleware for logging
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
//     next();
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('Error:', err);
//     res.status(500).json({ message: err.message });
// });

// // Database connection
// mongoose.connect(process.env.MONGO_URI, {
//     // Additional options if needed
// }).then(() => {
//     console.log('Connected to MongoDB');
// }).catch((err) => {
//     console.error('Error connecting to MongoDB:', err);
// });

// // Use routes
// app.use('/', userRoutes);
// app.use('/', gameRoutes);
// app.use('/', playerRoutes);
// app.use('/', authRoutes);
// app.use('/', groupRoutes);
// app.use('/', groupMemberRoutes);
// app.use('/', notificationRoutes);
// app.use('/', profileRoutes);
// app.use('/reviews', reviewRoutes);
// app.use('/', guestProfileRoutes);

// // Add a test endpoint for CORS verification
// app.get('/test-cors', (req, res) => {
//     res.json({ message: 'CORS is working correctly' });
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });


// server.js
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

// Middleware
app.use(cors({
    origin: ['https://all-in-4ce60.web.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/', playerRoutes);
app.use('/', authRoutes);
app.use('/', groupRoutes);
app.use('/', groupMemberRoutes);
app.use('/', notificationRoutes);
app.use('/', profileRoutes);
app.use('/reviews', reviewRoutes);// New route registration
app.use('/', guestProfileRoutes);


// Start the server
app.listen(3001, () => {
    console.log('Server is running on port 3001');
});