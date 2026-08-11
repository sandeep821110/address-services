import mongoose from "mongoose";
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

  } catch (error) {

    console.error("MongoDB Connection Failed", error);
    throw error;

  }
};

export default connectDB;