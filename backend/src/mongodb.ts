import mongoose from 'mongoose';

const MONGODB_URI = Bun.env.MONGODB_URI || 'mongodb://mongodb:27017/news?authSource=admin&directConnection=true';

const connectMongoDB = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB at', MONGODB_URI);
    await mongoose.connect(MONGODB_URI, {connectTimeoutMS: 1000});
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectMongoDB;
