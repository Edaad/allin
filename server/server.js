const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const playerRoutes = require('./routes/playerRoutes');

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://admin:admin@allin.xq3ezsf.mongodb.net/poker', {
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

app.use('/', userRoutes);
app.use('/', gameRoutes);
app.use('/', playerRoutes);

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});
