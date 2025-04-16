// const express = require("express");
// require("dotenv").config();
// const mongoose = require("mongoose");
// const cors = require("cors");
// const app = express();

// // Import routes
// const userRoutes = require("./routes/userRoutes");
// const gameRoutes = require("./routes/gameRoutes");
// const playerRoutes = require("./routes/playerRoutes");
// const authRoutes = require("./routes/authRoutes");
// const groupRoutes = require("./routes/groupRoutes");
// const groupMemberRoutes = require("./routes/groupMemberRoutes");
// const notificationRoutes = require("./routes/notificationRoutes");
// const profileRoutes = require("./routes/profileRoutes");
// const reviewRoutes = require("./routes/reviewRoutes");
// const guestProfileRoutes = require("./routes/guestProfileRoutes");

// // Configure CORS first
// app.use(
// 	cors({
// 		origin: ["https://all-in-4ce60.web.app", "http://localhost:3000"],
// 		credentials: true,
// 		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
// 		allowedHeaders: [
// 			"Content-Type",
// 			"Authorization",
// 			"Origin",
// 			"Accept",
// 			"X-Requested-With",
// 		],
// 	})
// );

// app.use(express.json());

// // Then register routes
// app.use("/", userRoutes);
// app.use("/", gameRoutes);
// app.use("/", playerRoutes);
// app.use("/", authRoutes);
// app.use("/", groupRoutes);
// app.use("/", groupMemberRoutes);
// app.use("/", notificationRoutes);
// app.use("/", profileRoutes);
// app.use("/reviews", reviewRoutes);
// app.use("/", guestProfileRoutes);

// // Add explicit handling for OPTIONS requests
// app.options('*', cors());

// // Add request logging for local development
// if (process.env.NODE_ENV === "development") {
// 	app.use((req, res, next) => {
// 		console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
// 		next();
// 	});
// }

// // Database connection
// mongoose
// 	.connect(process.env.MONGO_URI)
// 	.then(() => {
// 		console.log("Connected to MongoDB");
// 	})
// 	.catch((err) => {
// 		console.error("Error connecting to MongoDB:", err);
// 	});

// // Health check endpoint
// app.get("/health", (req, res) => {
// 	res.status(200).json({ status: "Server is running" });
// });

// // Start the server
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
// 	console.log(`Server is running on port ${PORT}`);
// 	console.log(
// 		`Server running in ${process.env.NODE_ENV || "production"} mode`
// 	);
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