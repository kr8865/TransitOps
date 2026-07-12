const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Models for Seeding
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));


app.get('/', (req, res) => {
  res.send('TransitOps API is running...');
});

// Database Seeding Function


// Start Server
const PORT = process.env.PORT || 5001;

// Force reload for DB Atlas configurations 2
connectDB().then(() => {
  seedDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
});
