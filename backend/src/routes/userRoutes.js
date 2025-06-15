// src/routes/user.routes.js

import { Router } from "express";
import { getProfile } from "../controllers/user.controller.js";

const userRouter = Router()

userRouter.get('/profile', getProfile);

export default userRouter;