import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rental_system';
    if (typeof uri === 'string' && uri.startsWith("'") && uri.endsWith("'")) {
      uri = uri.slice(1, -1);
    }
    if (typeof uri === 'string' && uri.startsWith('"') && uri.endsWith('"')) {
      uri = uri.slice(1, -1);
    }
    const conn = await mongoose.connect(uri);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`🚨 MongoDB Connection Error: ${error.message}`);
    console.log('💡 Tip: Make sure MongoDB is installed and running locally, or update the MONGODB_URI in backend/.env');

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
