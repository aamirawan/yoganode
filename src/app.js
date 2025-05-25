import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import passport from "./config/authConfig.js";
import authRoutes from "./routes/authRoutes.js";
import otpRoutes from "./routes/otpRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import enhancedClassRoutes from "./routes/enhancedClassRoutes.js";
import classExceptionRoutes from "./routes/classExceptionRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import userPreferencesRoutes from "./routes/userPreferencesRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/classes", enhancedClassRoutes);
// Public routes that don't require authentication
app.use("/api/public", publicRoutes);
// User preferences routes (including questionnaire)
app.use("/api/preferences", userPreferencesRoutes);
// Fix the class exception routes registration - use the correct path
// The routes in classExceptionRoutes.js include /classes/:class_id/exceptions
// So we need to register them with /api as the base path
app.use("/api", classExceptionRoutes);

export default app;
