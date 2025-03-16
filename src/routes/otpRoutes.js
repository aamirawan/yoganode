import express from "express";
import { sendOtpToUser, verifyOtp } from "../controllers/userController.js";

const router = express.Router();

router.post("/send-otp", sendOtpToUser);
router.post("/verify-otp", verifyOtp);

export default router;
