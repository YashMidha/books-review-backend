import mongoose from "mongoose";
const { Schema, model, Types } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  profileImg: { type: String, default: "/images/default-profile.png" },
  bio: { type: String, default: "I am an avid reader!" },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  planToRead: [{ type: Types.ObjectId, ref: "Book" }],
  reading: [{ type: Types.ObjectId, ref: "Book" }],
  completed: [{ type: Types.ObjectId, ref: "Book" }],

  ratingsAndReviews: [{
    bookId: { type: mongoose.Types.ObjectId, ref: "Book", required: true },
    rating: { type: Number, min: 0, max: 5 },
    review: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }],

  pagesRead: [{
    bookId: { type: Types.ObjectId, ref: "Book" },
    pagesRead: Number,
  }],
}, {
  timestamps: true,
});

export default model("User", UserSchema);
