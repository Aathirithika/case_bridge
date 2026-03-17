import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to db');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection is disconnected');
    });

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;