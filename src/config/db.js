import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/kevalon_interview';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}
