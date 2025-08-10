import express from "express";
import 'dotenv/config';
import cors from "cors";
import connectDB from "./src/config/db.js";
import booksRouter from "./src/routes/bookRoutes.js";
import userRouter from "./src/routes/userRoutes.js";
import geminiAIRouter from "./src/routes/geminiAIRoutes.js";
import recommendRouter from "./src/routes/recommendationRoute.js";
import authRouter from "./src/routes/authRouter.js";

const app = express();

const corsOptions = {
  origin: [process.env.FRONTEND_URI],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;

app.use("/api/books", booksRouter);
app.use("/api/users", userRouter);
app.use("/api/gemini", geminiAIRouter);
app.use("/api/auth", authRouter);
app.use("/api/recommendation", recommendRouter);

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});


const startServer = async () => {
    try{
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on port: ${PORT}`);
        });

        server.on("error", (error) => {
            console.error("Server error", error);
            process.exit(1);
        });

    } catch(err){
        console.log("Failed to connect", err);
        process.exit(1);
    }
}

startServer();
