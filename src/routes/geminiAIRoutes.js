import express from "express";
import { enchanceReview } from "../controllers/geminiAIController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const geminiAIRouter = express.Router();

geminiAIRouter.post("/enhance", authenticateUser, enchanceReview);

export default geminiAIRouter;