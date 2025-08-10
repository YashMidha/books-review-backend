import bookModel from "../models/bookModel.js";
import userModel from "../models/userModel.js";
import { getGoogleAPI, getIsbnFromVolumeInfo, searchGoogleAPI } from "../utils/googleBooksAPI.js";

export const getBook = async (req, res) => {
  try {

    const { isbn } = req.params;
    let book = await bookModel.findOne({ isbn });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!book.googleBooksId) {
      const books = await getGoogleAPI(isbn);

      if (!books || books.length === 0) {
        return res.status(404).json({ message: "No data from Google API" });
      }

      const volumeInfo = books[0].volumeInfo;
      const saleInfo = books[0].saleInfo;
      const googleBooksId = books[0].id;

      book.googleBooksId = googleBooksId;
      book.title = volumeInfo.title || book.title;
      book.authors = volumeInfo.authors || book.authors;
      book.publisher = volumeInfo.publisher || book.publisher;
      book.publishedDate = volumeInfo.publishedDate || book.publishedDate;
      book.description = volumeInfo.description || book.description;
      book.pageCount = volumeInfo.pageCount || book.pageCount;
      book.printType = volumeInfo.printType || book.printType;
      book.imageLinks = volumeInfo.imageLinks || book.imageLinks;
      book.language = volumeInfo.language || book.language;
      book.genre = volumeInfo.categories || book.genre;
      book.avgRating = (book.avgRating === 0)? (volumeInfo.averageRating || book.avgRating): book.avgRating;
      book.totalRatings = (book.totalRatings === 0 )? (volumeInfo.ratingsCount || book.totalRatings): book.totalRatings;

      if (saleInfo && saleInfo.retailPrice) {
        book.retailPrice = {
          amount: saleInfo.retailPrice.amount,
          currencyCode: saleInfo.retailPrice.currencyCode,
        };
      }

      await book.save();
    }

    return res.status(200).json({ message: "Success", book });

  } catch (err) {
    console.error("Error fetching book:", err);
    return res.status(500).json({ message: "Failed to fetch book" });
  }
};

export const getByAuthor = async (req, res) => {
    try{
        const { isbn } = req.params;
        const book = await bookModel.findOne({isbn}).select("authors");
        if (!book || !book.authors || book.authors.length === 0){
            return res.status(404).json({ message: "No authors found for this book" });
        }

        const books = await bookModel.find({
            authors: { $in: book.authors },
            isbn: { $ne: isbn },
        }).sort({avgRating: -1, totalRatings: -1}).limit(20);
        
        return res.status(200).json({ author: book.authors, books });

    } catch(err){
        console.error("Error fetching books written by author:", err);
        return res.status(500).json({message: "Failed to fetch books written by this author"})
    }
};

export const getReviews = async (req, res) => {
    try{
      const { isbn } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page-1)*limit;

      const book = await bookModel.findOne({isbn});
      if (!book){
          return res.status(404).json({ message: "Book not found" });
      }
      
      const users = await userModel.find({
        "ratingsAndReviews.bookId": book._id,
      })
      .select("name profileImg ratingsAndReviews")
      .lean();

      let matchingReviews = [];

      users.forEach((user) => {
        user.ratingsAndReviews.forEach(entry  => {
          if (
            entry.bookId.toString() === book._id.toString() &&
            entry.rating !== undefined &&
            entry.rating !== null &&
            entry.review && entry.review.trim() !== ''
          ){
            matchingReviews.push({
              name: user.name,
              profileImg: user.profileImg,
              rating: entry.rating,
              review: entry.review,
              date: entry.updatedAt,
            });
          }
        })
      })

      const totalReviews = matchingReviews.length;
      const paginated = matchingReviews.slice(skip, skip + limit);

      return res.status(200).json({
        totalReviews,
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        reviews: paginated,
      })

    } catch(err){
      console.error("Error fetching reviews:", err);
      return res.status(500).json({ message: "Failed to fetch reviews" });
    }
}

export const getPopular = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalBooks = await bookModel.countDocuments({ totalRatings: { $gte: 20000 }, avgRating: { $gte: 4} });

    const popularBooks = await bookModel
      .find({ totalRatings: { $gte: 20000 }, avgRating: { $gte: 4} })
      .sort({ avgRating: -1, totalRatings: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      totalBooks,
      currentPage: page,
      totalPages: Math.ceil(totalBooks / limit),
      books: popularBooks,
    });

  } catch (err) {
    console.error("Error fetching popular books:", err);
    return res.status(500).json({ message: "Failed to fetch popular books" });
  }
};

export const search = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm?.trim() || "";
    const selectedGenre = req.query.genre;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 21;
    const skip = (page - 1) * limit;

    if (!searchTerm && !selectedGenre) {
      const books = await bookModel
        .find({ totalRatings: { $gte: 20000 }, avgRating: { $gte: 4}  })
        .sort({ avgRating: -1, totalRatings: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalBooks = await bookModel.countDocuments({ totalRatings: { $gte: 20000 }, avgRating: { $gte: 4}  });

      return res.status(200).json({
        fallback: true,
        message: "No search term provided. Showing popular books.",
        currentPage: page,
        totalPages: Math.ceil(totalBooks / limit),
        books,
      });
    }

    let query = {};

    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { authors: { $elemMatch: { $regex: searchTerm, $options: "i" } } },
        { genre: { $elemMatch: { $regex: searchTerm, $options: "i" } } }
      ];
    }

    if (selectedGenre) {
      query.genre = { $in: [selectedGenre] };
    }

    let totalResults = await bookModel.countDocuments(query);
    let books = await bookModel.find(query)
      .limit(limit)
      .skip(skip)
      .lean();
    
    if (totalResults < 20 && searchTerm) {
      console.log("Searching google API...");
      let countGoogleResult = 0;
      const googleResults = await searchGoogleAPI(searchTerm);

      for (const gBook of googleResults) {
        const isbn = getIsbnFromVolumeInfo(gBook.volumeInfo);
        if (!isbn) continue;

        const exists = await bookModel.findOne({ isbn });
        if (!exists) {
          const newBook = new bookModel({
            isbn,
            googleBooksId: gBook.id,
            title: gBook.volumeInfo.title,
            authors: gBook.volumeInfo.authors || [],
            publisher: gBook.volumeInfo.publisher || "",
            publishedDate: gBook.volumeInfo.publishedDate || "",
            description: gBook.volumeInfo.description || "",
            pageCount: gBook.volumeInfo.pageCount || 0,
            printType: gBook.volumeInfo.printType || "",
            imageLinks: gBook.volumeInfo.imageLinks || {},
            language: gBook.volumeInfo.language || "",
            genre: gBook.volumeInfo.categories || [],
            avgRating: gBook.volumeInfo.averageRating || 0,
            totalRatings: gBook.volumeInfo.ratingsCount || 0,
            retailPrice: gBook.saleInfo?.retailPrice || null,
          });
          await newBook.save();
          countGoogleResult++;
        }
      }

      console.log("Added " + countGoogleResult + " books");
      totalResults = await bookModel.countDocuments(query);
      books = await bookModel.find(query).limit(limit).skip(skip).lean();
    }

    return res.status(200).json({
      fallback: false,
      message: `Search results for: ${searchTerm}`,
      results: books.length,
      totalResults,
      currentPage: page,
      totalPages: Math.ceil(totalResults / limit),
      books,
    });

  } catch (err) {
    console.error("Error searching books:", err);
    return res.status(500).json({ message: "Failed to search books" });
  }
};

export const getGenres = async (req, res) => {
  try {
    const genres = await bookModel.aggregate([
      { $unwind: "$genre" },
      { $match: { genre: { $nin: [null, "", []] } } },
      { $group: { _id: "$genre", count: { $sum: 1 } } }, 
      { $match: { count: { $gt: 100 } } }, 
      { $sort: { _id: 1 } },
      { $project: { _id: 0, genre: "$_id" } }
    ]);

    res.status(200).json({ genres: genres.map(g => g.genre) });
  } catch (err) {
    console.error("Failed to get genres:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


