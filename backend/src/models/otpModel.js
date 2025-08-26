// src/models/otpModel.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ["signup", "forgot-password"], required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = mongoose.model("Otp", otpSchema);
