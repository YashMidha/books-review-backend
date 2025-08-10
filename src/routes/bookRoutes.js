import express from "express";
import { getByAuthor, getBook, getReviews, getPopular, search, getGenres } from "../controllers/bookController.js";

const booksRouter = express.Router();

booksRouter.get("/popular", getPopular);
booksRouter.get("/search", search);
booksRouter.get("/genres", getGenres);
booksRouter.get("/:isbn/author", getByAuthor);
booksRouter.get("/:isbn/reviews", getReviews);
booksRouter.get("/:isbn", getBook);

export default booksRouter;