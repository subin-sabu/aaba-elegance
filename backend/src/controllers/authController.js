import express from "express";
import mongoose from "mongoose"
import {config} from "dotenv"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
config()
const app = express();

app.use(express.json())

// global error handler
const globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({success: false, message: err.message || "Something went wrong"})
}
// custom errors
class AppError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status;
    this.name = "AppError"
  }
}

//models
const userSchema = new mongoose.Schema({
  name: {type: String, required: [true, "Name is required"], trim: true},
  email: {type: String, required: [true, "Email is required"], unique: true, index: true, trim: true, lowercase:true},
  password: {type: String, default: null, trim: true},
  googleId: String,
  role: {type: String, enum: {values:["user", "admin"], message: "{VALUE} not allowed"}, default: "user"}
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

const otpSchema = new mongoose.Schema({
  email: {type: String, required: true},
  otp: {type: String, minLength: 4, maxLength: 6, required: true},
  createdAt: {type: Date, default: Date.now(), expires: 300},
  used: {type: Boolean, default: false},
  isTokenValid: {type: Boolean, default: true}
})

const Otp = mongoose.model("Otp", otpSchema);

// controllers
const loginOrSignup = async (req, res, next) => {
  try {
    const {email} = req.body;
    if (!email) throw new AppError("email is required", 401);
    const user = await User.findOne({email});
    if (!user) return res.json({
      success: true, 
      newUser: true, 
      message: "Looks like you're new here! Please confirm the OTP we sent to your email"
    });
    if (user.password) {
      return res.json({success: true, email: user.email, message: "Welcome back!, Please enter your password"});
    } else if (user.googleId) {
      return res.json({success: true, userId: user._id, message: "Looks like you signed in with Google previously, Would you like to create a password as well?"})
    }
  } catch (e) {
    next(e);
  }
}

const login = async (req, res, next) => {
  try {
    const {email, password} = req.body;
    if (!email.trim() || !password.trim() ) throw new AppError("both email & password required", 401);
    const user = await User.findOne({email});
    if (!user) throw new AppError("user not found", 404);
    if (!user.password) throw new AppError("password login unavailable", 403);
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const data = user.toObject();
      delete data.password;
      const token = await jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "30d"});
      return res.status(200).json({success: true, token, user: data, message: `welcome back ${user.name}!`});
    } else {
      throw new AppError("Incorrect Password", 401);
    }
  } catch (e) {
    next(e)
  }
}

const sendOtp = async (req, res, next) => {
  try {
    const {email} = req.body;
    if (!email) throw new AppError("Email is required", 401);
    const rateLimitTime = 5 // minutes
    const count = await Otp.countDocuments({email, createdAt: {$gt: Date.now() - rateLimitTime * 60 * 1000}});
    if (count < 3) {
      const otp = Math.floor(Math.random() * 9000 + 1000);
      await Otp.create({email, otp})
      console.log("otp is ", otp);
      return res.status(200).json({success: true, message: "otp sent successfully"})
    } else {
      throw new AppError(`Too many attempts... Please take a ${rateLimitTime} minutes break and try again.`, 429);
    }
  } catch (e) {
    next(e);
  }
}

const validateOtp = async (req, res, next) => {
  try {
    const {email, otp} = req.body;
    if (!email || !otp) throw new AppError("email and otp required", 401);
    const otpDoc = await Otp.findOne({email, used: false}).sort({createdAt: -1});
    if (!otpDoc) throw new AppError("No otp found", 404);
    const isValid = Number(otp) === Number(otpDoc.otp);
    if (!isValid) throw new AppError("Invalid otp", 400);
    const tempToken = jwt.sign({id: otpDoc._id, email}, process.env.JWT_SECRET, {expiresIn: "5m"});
    //await Otp.updateOne({_id: otpDoc._id}, {used: true}); /* This is not required. OTPs can live until a persistent token is generated with its tempToken. Multiple tempTokens could be generated with one OTP, but the one that makes persistent token first wins. */
    res.json({success: true, tempToken, message: "create new password with temp token"});
  } catch (e) {
    next(e);
  }
}

const createPassword = async (req, res, next) => {
  try {
    const {email, password, name} = req.body;
    // provide name only if "loginOrSignup" returned 404 
    if (!email || !password) throw new AppError("email and password required", 401);
    const authToken = req.headers["authorization"]?.split(" ")[1];
    if (!authToken) throw new AppError("Temp Token missing", 401);
    const payload = await jwt.verify(authToken, process.env.JWT_SECRET);
    if (payload.email !== email) throw new AppError("Invalid token", 401);
    const otpDoc = await Otp.findOne({_id: payload.id});
    if (!otpDoc.isTokenValid) throw new AppError("Token expired", 401);
    let user = await User.findOne({email});
    if (user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.findOneAndUpdate({email}, {password: hashedPassword}, {new: true});
      const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "30d"});
      await Otp.updateOne({_id: otpDoc._id}, {isTokenValid: false});
      return res.status(200).json({success: true, message: "sign in successful", token, user});
    } else if (!user && !name) {
      throw new AppError("new user, name is required", 400);
    } else {
      const hash = await bcrypt.hash(password, 10);
      user = await User.create({email, password: hash, name});
      const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: "30d"})
      res.status(201).json({success: true, message: "signup successful", token, user})
    }
  } catch (e) {
    next(e)
  }
}


// routes
const userRoutes = express.Router();
userRoutes.post("/login-signup", loginOrSignup);
userRoutes.post("/login", login);
userRoutes.post("/send-otp", sendOtp);
userRoutes.post("/validate-otp", validateOtp);
userRoutes.post("/create-password", createPassword);


app.use("/api/user", userRoutes);

app.use(globalErrorHandler);

mongoose.connect("mongodb://127.0.0.1:27017/auth-example").then(
  () => app.listen(3000, () => console.log("server running on port 3000"))
).catch(e => console.error(e.message))
