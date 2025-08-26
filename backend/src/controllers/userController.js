// src/controllers/userController.js
import User from "../models/userModel.js";
import { Otp } from "../models/otpModel.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";  


//////////////////// Helpers ////////////////////

const sendMail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({ from: process.env.EMAIL, to, subject, text });
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

//////////////////// Step 1: Request OTP ////////////////////

const requestOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) throw new AppError("Email and purpose required", 400);

    // Rate limit (max 5/hr)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const count = await Otp.countDocuments({ email, createdAt: { $gte: oneHourAgo } });
    if (count >= 5) throw new AppError("Too many OTP requests. Try later.", 429);

    // Invalidate old OTPs
    await Otp.updateMany({ email, purpose, used: false }, { used: true });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ email, otp, purpose, expiresAt });

    await sendMail(email, "Your OTP", `Your OTP is ${otp}. Valid for 5 minutes.`);
    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    next(err);
  }
};

//////////////////// Step 2: Verify OTP (signup/forgot-password) ////////////////////

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp || !purpose) throw new AppError("Email, OTP and purpose required", 400);
    const record = await Otp.findOne({ email, otp, purpose, used: false, expiresAt: { $gt: new Date() } });
    if (!record) throw new AppError("Invalid or expired OTP", 400);

    record.used = true;
    await record.save();

    // If signup OTP verified → return short-lived token so user can continue to password setup
    const tempToken = jwt.sign({ email, purpose }, process.env.JWT_SECRET, { expiresIn: "30m" });

    res.json({ success: true, message: "OTP verified", tempToken });
  } catch (err) {
    next(err);
  }
};

//////////////////// Step 3: Complete Signup ////////////////////

const completeSignup = async (req, res, next) => {
  try {
    const { name, password } = req.body;
    const tempToken = req.headers.authorization?.split(" ")[1];
    if (!tempToken) throw new AppError("Missing temp token", 400);

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "signup") throw new AppError("Invalid token purpose", 403);

    const existing = await User.findOne({ email: decoded.email });
    if (existing) throw new AppError("User already exists", 409);

    if (!name || !password) throw new AppError("Name and password required", 400);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: decoded.email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setTokenCookie(res, token);

    res.json({ success: true, message: "Signup complete", user });
  } catch (err) {
    next(err);
  }
};

//////////////////// Login ////////////////////

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      await user.save();

      if (user.failedLoginAttempts === 2) {
        await sendMail(user.email, "Suspicious Login", "Someone tried to login to your account twice with wrong password.");
      }
      throw new AppError("Invalid credentials", 403);
    }

    user.failedLoginAttempts = 0;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setTokenCookie(res, token);

    res.json({ success: true, message: `Welcome back ${user.name}`, user });
  } catch (err) {
    next(err);
  }
};

//////////////////// Forgot Password Reset ////////////////////

const forgotPasswordReset = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const tempToken = req.headers.authorization?.split(" ")[1];
    if (!tempToken) throw new AppError("Missing temp token", 400);

    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (decoded.purpose !== "forgot-password") throw new AppError("Invalid token purpose", 403);

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ email: decoded.email }, { password: hashed });
    if (!user) throw new AppError("User not found", 404);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setTokenCookie(res, token);

    res.json({ success: true, message: "Password reset successful", user });
  } catch (err) {
    next(err);
  }
};

//////////////////// Google Auth ////////////////////

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) throw new AppError("Google ID token required", 400);

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) throw new AppError("Google account must have email", 400);

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user
      user = await User.create({
        email,
        name,
        profilePhoto: picture,
        isGoogleAccount: true,
        "socialIds.googleId": googleId,
        role: "user",
      });
    } else {
      // Existing account
      if (!user.socialIds.googleId) {
        // Link Google account to existing password-based user
        user.socialIds.googleId = googleId;
        user.isGoogleAccount = true;
        user.profilePhoto = user.profilePhoto || picture;
        user.name = user.name || name;
        await user.save();
      }
    }

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    setTokenCookie(res, token);

    res.json({ success: true, message: "Google auth successful", user });
  } catch (err) {
    next(err);
  }
};

//////////////////// Update User Fields ////////////////////

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.user; // assume middleware added user to req
    const updates = req.body;

    const disallowed = ["email", "password"];
    for (let key of disallowed) {
      if (key in updates) throw new AppError(`${key} cannot be updated`, 400);
    }

    if ("name" in updates && !updates.name.trim()) throw new AppError("Name cannot be empty", 400);

    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!user) throw new AppError("User not found", 404);

    res.json({ success: true, message: "Profile updated", user });
  } catch (err) {
    next(err);
  }
};

export { requestOtp, verifyOtp, completeSignup, loginUser, forgotPasswordReset, googleAuth, updateUser };
