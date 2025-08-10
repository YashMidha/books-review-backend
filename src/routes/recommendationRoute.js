import express from "express";
import { recommendBook, recommendForUser } from "../controllers/recommendationController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const recommendRouter = express.Router();

recommendRouter.get("/book/:isbn", recommendBook);
recommendRouter.get("/user", authenticateUser, recommendForUser);

export default recommendRouter;
