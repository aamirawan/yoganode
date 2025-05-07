import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { sendOTP } from "../config/otpService.js";

dotenv.config();

// Generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Store OTPs temporarily
const otpStorage = {};

// **Register User**
export const registerUser = async (req, res) => {
  const { first_name, last_name, email, phone_no, password, role, preferences } = req.body;

  if (!first_name || !last_name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const focusData = preferences.focus ? JSON.stringify(preferences.focus) : null;
    const healthConcernsData = preferences.healthConcerns ? JSON.stringify(preferences.healthConcerns) : null;
    const sessionTypeData = preferences.sessionType ? JSON.stringify(preferences.sessionType) : null;
    //console.log(hashedPassword)
    await pool.query("INSERT INTO users (first_name, last_name, email, phone, password, role, focus, health_concerns, session_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
      first_name, last_name, email, phone_no, hashedPassword, role, focusData, healthConcernsData, sessionTypeData
    ]);

    return res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", "error": error.message });
  }
};

// **Login User**
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(400).json({ message: "Invalid credentials" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log(user);
    return res.json({ token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role, focus: user.focus, health_concerns: user.health_concerns, phone_no: user.phone } });
  } catch (error) {
    console.error(error); // Add error logging
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get User Profile**
export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = ?", [req.user.id]);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    return res.json(users[0]);
  } catch (error) {
    console.error(error); // Add error logging
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Send OTP**
export const sendOtpToUser = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  const otp = generateOTP();
  otpStorage[phone] = otp;

  const sent = await sendOTP(phone, otp);
  if (sent) return res.json({ message: "OTP sent successfully" });
  else return res.status(500).json({ message: "Failed to send OTP" });
};

// **Verify OTP**
export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (otpStorage[phone] && otpStorage[phone] === parseInt(otp)) {
    delete otpStorage[phone]; // Remove OTP after successful verification
    return res.json({ message: "OTP verified successfully" });
  } else {
    return res.status(400).json({ message: "Invalid OTP" });
  }
};
