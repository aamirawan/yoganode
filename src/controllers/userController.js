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
export const registerUser = async (req, res) => { console.log("test")
  const { name, email, phone_no, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword)
    await pool.query("INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)", [
      name, email, phone_no, hashedPassword, role
    ]);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", "error": error });
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
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error); // Add error logging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get User Profile**
export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT id, full_name, email, role FROM users WHERE id = ?", [req.user.id]);
    if (!users.length) return res.status(404).json({ message: "User not found" });

    res.json(users[0]);
  } catch (error) {
    console.error(error); // Add error logging
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Send OTP**
export const sendOtpToUser = async (req, res) => {
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  const otp = generateOTP();
  otpStorage[phone] = otp;

  const sent = await sendOTP(phone, otp);
  if (sent) res.json({ message: "OTP sent successfully" });
  else res.status(500).json({ message: "Failed to send OTP" });
};

// **Verify OTP**
export const verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  if (otpStorage[phone] && otpStorage[phone] === parseInt(otp)) {
    delete otpStorage[phone]; // Remove OTP after successful verification
    res.json({ message: "OTP verified successfully" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
};
