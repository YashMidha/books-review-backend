import similarBookModel from "../models/similarBookModel.js";
import bookModel from "../models/bookModel.js";
import userModel from "../models/userModel.js";
import { isbn13to10, isbn10to13 } from "../utils/isbnUtil.js";

async function getRecommendationsForIsbn(isbn) {
    const isbn_13 = isbn10to13(isbn);

    let similar = await similarBookModel.findOne({ isbn: isbn_13 });
    if (!similar || similar.top_similar.length === 0) {
        similar = await similarBookModel.findOne({ isbn });
    }

    let recommendedBooks = [];

    if (similar && similar.top_similar.length > 0) {
        const isbn10List = similar.top_similar
            .map(isbn13to10)
            .filter(Boolean);

        recommendedBooks = await bookModel
            .find({ isbn: { $in: isbn10List } })
            .sort({ avgRating: -1, totalRatings: -1 })
            .limit(10)
            .lean();
    }

    if (recommendedBooks.length === 0) {
        const currentBook = await bookModel.findOne({ isbn }).lean();
        if (currentBook?.authors?.length > 0) {
            recommendedBooks = await bookModel
                .find({
                    authors: { $in: currentBook.authors },
                    isbn: { $ne: isbn },
                })
                .sort({ avgRating: -1, totalRatings: -1 })
                .limit(10)
                .lean();
        }
    }

    return {
        source: similar?.top_similar?.length ? "similar" : "author",
        books: recommendedBooks
    };
}

export const recommendBook = async (req, res) => {
    try {
        const { isbn } = req.params;
        const currentBook = await bookModel.findOne({ isbn });

        if (!currentBook) {
            return res.status(404).json({ message: "Book not found" });
        }

        const { source, books } = await getRecommendationsForIsbn(isbn);

        return res.status(200).json({
            source,
            recommendations: books,
        });
    } catch (err) {
        console.error("Error getting recommendations:", err);
        res.status(500).json({ message: "Failed to get recommendations" });
    }
};


export const recommendForUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const user = await userModel.findById(userId)
            .select("completed ratingsAndReviews")
            .lean();

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const highRatedBookIds = user.ratingsAndReviews
            .filter(r => r.rating >= 4)
            .map(r => r.bookId.toString());

        const completedIds = user.completed.map(id => id.toString());

        const allRelevantBookIds = [...new Set([...completedIds, ...highRatedBookIds])];

        const total = allRelevantBookIds.length;
        const paginatedIds = allRelevantBookIds.slice(skip, skip + limit);

        const baseBooks = await bookModel
            .find({ _id: { $in: paginatedIds } })
            .select("title isbn")
            .lean();

        const response = [];

        for (const base of baseBooks) {
            const { books } = await getRecommendationsForIsbn(base.isbn);

            response.push({
                title: base.title,
                isbn: base.isbn,
                recommendations: books,
            });
        }

        return res.status(200).json({
            totalBooksConsidered: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            personalizedRecommendations: response,
        });
    } catch (err) {
        console.error("Error in user-based recommendations:", err);
        return res.status(500).json({ message: "Failed to fetch personalized recommendations" });
    }
};
