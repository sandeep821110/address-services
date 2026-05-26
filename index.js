import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import redis from "./src/config/redis.js";
import { connectRabbitMQ } from "./src/config/rabbitmq.js";

dotenv.config();

const start = async () => {
  await connectDB();

  try {
    await connectRabbitMQ();
  } catch (err) {
    console.error("RabbitMQ connection failed:", err.message);
  }

  const PORT = process.env.PORT || 5015;

  app.listen(PORT, () => {
    console.log(`Address Service Running on ${PORT}`);
  });
};

start();

export { redis };