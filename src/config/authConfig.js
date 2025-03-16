import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import pool from "./db.js";
import dotenv from "dotenv";

dotenv.config();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [profile.emails[0].value]);

        if (!user.length) {
          const newUser = {
            name: profile.displayName,
            email: profile.emails[0].value,
            role: "student",
            provider: "google",
          };
          await pool.query("INSERT INTO users (full_name, email, role, provider) VALUES (?, ?, ?, ?)", [
            newUser.name,
            newUser.email,
            newUser.role,
            newUser.provider,
          ]);
        }
        done(null, profile);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails ? profile.emails[0].value : null;

        if (!email) return done(new Error("Email not found in Facebook profile"), null);

        const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (!user.length) {
          const newUser = {
            name: profile.displayName,
            email: email,
            role: "student",
            provider: "facebook",
          };
          await pool.query("INSERT INTO users (full_name, email, role, provider) VALUES (?, ?, ?, ?)", [
            newUser.name,
            newUser.email,
            newUser.role,
            newUser.provider,
          ]);
        }
        done(null, profile);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
