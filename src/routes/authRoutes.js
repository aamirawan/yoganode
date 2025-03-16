import express from "express";
import passport from "../config/authConfig.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  const token = jwt.sign({ email: req.user.emails[0].value }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
});

// Facebook OAuth
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get("/facebook/callback", passport.authenticate("facebook", { session: false }), (req, res) => {
  const token = jwt.sign({ email: req.user.emails[0].value }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
});

export default router;
