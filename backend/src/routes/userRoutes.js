// src/routes/userRoutes.js
import express from "express";
import { 
  requestOtp, 
  verifyOtp, 
  completeSignup, 
  loginUser, 
  forgotPasswordReset, 
  updateUser 
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js"; 
import { googleAuth } from "../controllers/userController.js";



const router = express.Router();

// Auth + Signup + Password reset
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", completeSignup);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPasswordReset);

// Google Auth
router.post("/google-auth", googleAuth);

// Profile update
router.put("/update", protect, updateUser);

export default router;
