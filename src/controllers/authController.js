import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { validationResult } from "express-validator";
import sendOTP from "../utils/sendOtp.js"; 

export const registerUser = async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone]);
    if (existingUser.length) return res.status(400).json({ message: "Email or Phone already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [roleResult] = await pool.query("SELECT id FROM roles WHERE role_name = ?", [role]);

    if (!roleResult.length) return res.status(400).json({ message: "Invalid role" });

    const roleId = roleResult[0].id;
    const [result] = await pool.query("INSERT INTO users (full_name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?)",
      [full_name, email, phone, hashedPassword, roleId]);

    await sendOTP(result.insertId, phone);

    res.status(201).json({ message: "User registered. Verify OTP to activate account." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      if (!user.length) return res.status(400).json({ message: "Invalid credentials" });
  
      const isMatch = await bcrypt.compare(password, user[0].password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
      const payload = { user: { id: user[0].id, role: user[0].role_id } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  
      res.json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
  
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
};
  
