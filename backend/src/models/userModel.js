import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  email: {type: String, required: true, unique: true},
  password: {type: String}, // optional if googleId is present
  googleId: {type: String, unique: true, sparse: true}, // sparse true checks uniqueness only if documents contain this value
  phoneNumber: {type: String}
}, {timestamps: true});

export const User = mongoose.model('User', userSchema)