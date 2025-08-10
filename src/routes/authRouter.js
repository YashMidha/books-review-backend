import express from "express";
import upload from "../config/multer.js";
import { signup, login } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/signup", upload.single("profileImg"), signup);
authRouter.post("/login", login);

export default authRouter;
