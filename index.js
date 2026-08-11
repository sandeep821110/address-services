import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";

dotenv.config();

const requiredEnvVars = ["MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

let server;

const start = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  try {
    await connectRabbitMQ();
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
  }

  const PORT = process.env.PORT || 5015;

  server = app.listen(PORT, () => {
    console.log(`Address Service Running on ${PORT}`);
  });

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason?.message || reason);
    process.exit(1);
  });
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err.message);
    process.exit(1);
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    const { default: mongoose } = await import("mongoose");
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    console.log("All connections closed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Error during graceful shutdown:", err.message);
    process.exit(1);
  }
};

start();
