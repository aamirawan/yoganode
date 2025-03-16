import pool from "../config/db.js";

export const verifyOTP = async (req, res) => {
  const { user_id, otp_code } = req.body;

  try {
    const [otpResult] = await pool.query("SELECT * FROM otp_verifications WHERE user_id = ? AND otp_code = ? AND expires_at > NOW()", [user_id, otp_code]);

    if (!otpResult.length) return res.status(400).json({ message: "Invalid or expired OTP" });

    await pool.query("UPDATE users SET is_verified = 1 WHERE id = ?", [user_id]);
    await pool.query("DELETE FROM otp_verifications WHERE user_id = ?", [user_id]);

    res.json({ message: "OTP verified, account activated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
