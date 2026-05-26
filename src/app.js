import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { configDotenv } from "dotenv";
configDotenv();
import addressRoutes from "./routes/addressRoutes.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(helmet());
app.use(morgan("dev"));


app.use("/api/address", addressRoutes);

// Catch-all 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Drop unique email index if it exists (for migration)
mongoose.connection.on("open", async () => {
  try {
    const indexes = await mongoose.connection.db.collection("addresses").indexes();
    const emailIndex = indexes.find(idx => idx.name === "email_1");
    if (emailIndex) {
      await mongoose.connection.db.collection("addresses").dropIndex("email_1");
      console.log("Dropped unique index on email_1");
    }
    const userEmailIndex = indexes.find(idx => idx.name === "user_1_email_1");
    if (userEmailIndex) {
      await mongoose.connection.db.collection("addresses").dropIndex("user_1_email_1");
      console.log("Dropped unique index on user_1_email_1");
    }
  } catch (err) {
    if (err.codeName !== "IndexNotFound") {
      console.error("Error dropping index:", err.message);
    }
  }
});

export default app;