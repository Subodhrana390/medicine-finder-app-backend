import mongoose from "mongoose";

const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not defined in environment variables");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(`✅ Medical Shop Service - MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Medical Shop Service - MongoDB connection failed: ${error.message}`);
    setTimeout(connectDB, 5000);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Medical Shop Service - MongoDB disconnected. Reconnecting...");
    connectDB();
  });
};

export default connectDB;
