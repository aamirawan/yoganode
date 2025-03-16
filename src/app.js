import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import passport from "./config/authConfig.js";
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/teachers", teacherRoutes);

export default app;
