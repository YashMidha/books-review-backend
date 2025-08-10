import express from "express";
import {
  addBookToUser,
  checkUserBookStatus,
  getProfileInfo,
  getDashboard,
  getReading,
  getCompleted,
  getPlanned,
  getUserReviews,
  getUserBookReview,
  updateProfile,
  deleteBookFromUser
} from "../controllers/userController.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import upload from "../config/multer.js";

const userRouter = express.Router();

userRouter.use(authenticateUser);

// Profile
userRouter.get("/profile", getProfileInfo);
userRouter.put("/profile", upload.single("profileImg"), updateProfile);
userRouter.get("/dashboard", getDashboard);

// Book actions
userRouter.post("/book", addBookToUser);    
userRouter.get("/book/status", checkUserBookStatus);  
userRouter.get("/book/:isbn/review", getUserBookReview); 

// Lists
userRouter.get("/reading", getReading);
userRouter.get("/completed", getCompleted);
userRouter.get("/planned", getPlanned);

// Reviews
userRouter.get("/reviews", getUserReviews);

// Delete
userRouter.delete("/books/:isbn", deleteBookFromUser);

export default userRouter;
