import mongoose from "mongoose";
const { Schema, model } = mongoose;

const ImageLinksSchema = new Schema({
  smallThumbnail: String,
  thumbnail: String,
  small: String,
  medium: String,
  large: String,
  extraLarge: String,
}, { _id: false });

const RetailPriceSchema = new Schema({
  amount: Number,
  currencyCode: String,
}, { _id: false });

const BookSchema = new Schema({
  isbn: { type: String, unique: true, required: true },
  googleBooksId: {type: String, unique: true, sparse: true},
  avgRating: {type: Number, default: 0},
  totalRatings: {type: Number, default: 0},
  title: { type: String, required: true },
  authors: [{ type: String }],
  genre: [{ type: String }],
  publisher: String,
  publishedDate: String,
  description: String,
  pageCount: Number,
  printType: String,
  imageLinks: ImageLinksSchema,
  language: String,
  retailPrice: RetailPriceSchema,
}, {
  timestamps: true,
});

export default model("Book", BookSchema);
