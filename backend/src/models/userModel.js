// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // only for password-based accounts
    name: { type: String, required: true },
    phone: { type: String },
    address: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
      country: { type: String },
    },
    profilePhoto: { type: String },
    socialIds: {
      googleId: { type: String },
      facebookId: { type: String },
      twitterId: { type: String },
    },
    isGoogleAccount: { type: Boolean, default: false },

    // Role-based access
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // login attempts count
    failedLoginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
