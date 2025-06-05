// src/controllers/user.controller.js

import AppError from "../utils/AppError.js";

export function getProfile(req, res, next) {
  try {
   throw new AppError('unauthorized', 403)
  } catch (err) {
    next(err);
  }
}