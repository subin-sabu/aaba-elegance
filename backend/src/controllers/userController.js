// src/controllers/user.controller.js

import { User } from "../models/userModel.js";
import AppError from "../utils/AppError.js";

function getProfile(req, res, next) {
  try {
   throw new AppError('unauthorized', 403)
  } catch (err) {
    next(err);
  }
}

function createAccount(req,res, next) {
  // take out fields from req.body
  const { name, email, password, phoneNumber } = req.body;
}


export {getProfile}