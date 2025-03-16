import axios from "axios";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    const { email, name } = data;

    let [user] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

    if (!user.length) {
      const [roleResult] = await pool.query("SELECT id FROM roles WHERE role_name = 'student'");
      await pool.query("INSERT INTO users (full_name, email, is_verified, role_id) VALUES (?, ?, ?, ?)",
        [name, email, true, roleResult[0].id]);
    }

    const payload = { user: { email, role: "student" } };
    const authToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token: authToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "OAuth login failed" });
  }
};
