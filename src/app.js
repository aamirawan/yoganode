import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import db from "./config/db.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
