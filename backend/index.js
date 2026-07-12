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
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected; skipping seed process.');
      return;
    }

    console.log('MongoDB connected; seeding skipped in local/dev mode.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  }
};

// Start Server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
