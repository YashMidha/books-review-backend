import userModel from "../models/userModel.js";
import bookModel from "../models/bookModel.js";

export const addBookToUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isbn, status, pages, rating, review } = req.body;

    const validStatuses = ["planToRead", "reading", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid reading status" });
    }

    const book = await bookModel.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await userModel.findById(userId);

    user.planToRead = user.planToRead.filter(id => !id.equals(book._id));
    user.reading = user.reading.filter(id => !id.equals(book._id));
    user.completed = user.completed.filter(id => !id.equals(book._id));
    user[status].push(book._id);

    user.ratingsAndReviews = user.ratingsAndReviews.filter(
      r => !r.bookId.equals(book._id)
    );
    user.ratingsAndReviews.push({
      bookId: book._id,
      rating,
      review
    });

    user.pagesRead = user.pagesRead.filter(p => !p.bookId.equals(book._id));
    user.pagesRead.push({
      bookId: book._id,
      pagesRead: pages
    });

    await user.save();

    return res.status(200).json({ message: "Book added to your list successfully" });
  } catch (err) {
    console.error("Error adding book to user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const checkUserBookStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isbn } = req.query;

    if (!isbn) {
      return res.status(400).json({ message: "ISBN is required" });
    }

    const book = await bookModel.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await userModel.findById(userId).select("planToRead reading completed");

    const status =
      user.planToRead.includes(book._id) ? "planToRead" :
      user.reading.includes(book._id) ? "reading" :
      user.completed.includes(book._id) ? "completed" :
      null;

    return res.status(200).json({ alreadyAdded: !!status, status });

  } catch (err) {
    console.error("Error checking user book status:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProfileInfo = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("name email profileImg bio");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    console.error("Profile Info Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, bio } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (bio) user.bio = bio;

    if (req.file && req.file.path) {
      user.profileImg = req.file.path;
    }

    await user.save();

    return res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id).select("bio planToRead reading completed ratingsAndReviews");

    const booksPlanned = user.planToRead.length;
    const booksReading = user.reading.length;
    const booksCompleted = user.completed.length;

    const totalReviews = user.ratingsAndReviews.filter(r => r.review && r.review.trim()).length;
    const totalRatings = user.ratingsAndReviews.filter(r => r.rating > 0).length;
    const ratingSum = user.ratingsAndReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avgRating = totalRatings ? (ratingSum / totalRatings).toFixed(2) : "0.00";

    const ratingCounts = {
      "N/A": 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    user.ratingsAndReviews.forEach(r => {
      const rating = r.rating || 0;
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating] += 1;
      } else {
        ratingCounts["N/A"] += 1;
      }
    });

    return res.status(200).json({
      bio: user.bio,
      stats: {
        booksPlanned,
        booksReading,
        booksCompleted,
        totalReviews,
        totalRatings,
        avgRating,
      },
      ratingsStats: ratingCounts
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getReading = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id)
      .populate("reading")
      .select("reading pagesRead ratingsAndReviews");

    const pagesMap = new Map();
    user.pagesRead.forEach(p => pagesMap.set(p.bookId.toString(), p.pagesRead));

    const ratingMap = new Map();
    user.ratingsAndReviews.forEach(r => ratingMap.set(r.bookId.toString(), r.rating));

    const reading = user.reading.map(book => ({
      ...book.toObject(),
      pagesRead: pagesMap.get(book._id.toString()) || 0,
      rating: ratingMap.get(book._id.toString()) || '',
    }));

    res.status(200).json({ reading });
  } catch (err) {
    console.error("Get reading error:", err);
    res.status(500).json({ message: "Failed to fetch reading list" });
  }
};

export const getCompleted = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id)
      .populate("completed")
      .select("completed pagesRead ratingsAndReviews");

    const pagesMap = new Map();
    user.pagesRead.forEach(p => pagesMap.set(p.bookId.toString(), p.pagesRead));

    const ratingMap = new Map();
    user.ratingsAndReviews.forEach(r => ratingMap.set(r.bookId.toString(), r.rating));

    const completed = user.completed.map(book => ({
      ...book.toObject(),
      pagesRead: pagesMap.get(book._id.toString()) || 0,
      rating: ratingMap.get(book._id.toString()) || '',
    }));

    res.status(200).json({ completed });
  } catch (err) {
    console.error("Get completed error:", err);
    res.status(500).json({ message: "Failed to fetch completed list" });
  }
};

export const getPlanned = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id)
      .populate("planToRead")
      .select("planToRead pagesRead ratingsAndReviews");

    const pagesMap = new Map();
    user.pagesRead.forEach(p => pagesMap.set(p.bookId.toString(), p.pagesRead));
    
    const ratingMap = new Map();
    user.ratingsAndReviews.forEach(r => ratingMap.set(r.bookId.toString(), r.rating));

    const planToRead = user.planToRead.map(book => ({
      ...book.toObject(),
      pagesRead: pagesMap.get(book._id.toString()) || 0,
      rating: ratingMap.get(book._id.toString()) || '',
    }));

    res.status(200).json({ planToRead });
  } catch (err) {
    console.error("Get planToRead error:", err);
    res.status(500).json({ message: "Failed to fetch planned list" });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id)
      .select("ratingsAndReviews pagesRead")
      .populate("ratingsAndReviews.bookId", "isbn title authors imageLinks");

    const pagesMap = new Map();
    user.pagesRead.forEach(p => pagesMap.set(p.bookId.toString(), p.pagesRead));

    const reviews = user.ratingsAndReviews
    .filter(r => r.review && r.review.trim() !== "")
    .map(r => ({
      ...r.toObject(),
      book: r.bookId,
      pagesRead: pagesMap.get(r.bookId._id?.toString() || r.bookId.toString()) || 0
    }));

    res.status(200).json({ reviews });
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

export const getUserBookReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isbn } = req.params;

    const book = await bookModel.findOne({ isbn }).select("_id title");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await userModel.findById(userId).select("ratingsAndReviews pagesRead");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const reviewEntry = user.ratingsAndReviews.find(r => r.bookId.equals(book._id));
    const pagesEntry = user.pagesRead.find(p => p.bookId.equals(book._id));

    if (!reviewEntry) {
      return res.status(200).json({ exists: false, message: "No review found for this book" });
    }

    return res.status(200).json({
      exists: true,
      bookTitle: book.title,
      rating: reviewEntry.rating,
      review: reviewEntry.review,
      pagesRead: pagesEntry?.pagesRead || 0
    });

  } catch (err) {
    console.error("Error fetching user review:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteBookFromUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isbn } = req.params;

    const book = await bookModel.findOne({ isbn });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = await userModel.findById(userId);

    user.planToRead = user.planToRead.filter(id => !id.equals(book._id));
    user.reading = user.reading.filter(id => !id.equals(book._id));
    user.completed = user.completed.filter(id => !id.equals(book._id));

    user.ratingsAndReviews = user.ratingsAndReviews.filter(
      r => !r.bookId.equals(book._id)
    );

    user.pagesRead = user.pagesRead.filter(p => !p.bookId.equals(book._id));

    await user.save();

    return res.status(200).json({ message: "Book removed from your profile" });
  } catch (err) {
    console.error("Error deleting book from user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
