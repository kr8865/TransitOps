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
// Application routes
app.use('/api/trips', require('./routes/trips'));
app.use('/api/expenses', require('./routes/expenses'));


app.get('/', (req, res) => {
  res.send('TransitOps API is running...');
});

// Return JSON for unknown API routes (prevents HTML 404 pages)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  next();
});

// Generic error handler that returns JSON
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Database Seeding Function

const seedDatabase = async () => {
  // Only seed when explicitly requested via env var to avoid accidental data changes
  if (process.env.SEED_DB !== 'true') {
    console.log('SEED_DB not enabled; skipping database seeding.');
    return;
  }

  try {
    console.log('Seeding database...');
    // Minimal seeding example: create an admin user if none exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@transitops.local' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@transitops.local',
        password: process.env.ADMIN_PASSWORD || 'password',
        role: 'Admin'
      });
      await admin.save();
      console.log('Created admin user');
    }
  } catch (err) {
    console.error('Error during seeding:', err.message || err);
  }
};


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
