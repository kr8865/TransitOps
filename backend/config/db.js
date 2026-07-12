const mongoose = require('mongoose');

const connectDB = async () => {
<<<<<<< HEAD
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.log('MONGO_URI not set. Skipping MongoDB connection.');
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return null;
=======
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
>>>>>>> 3d337fa323697b8d8db7adbfd894a736e2dd1cc3
  }
};

module.exports = connectDB;
