import mongoose from "mongoose";

const SimilarBookSchema = new mongoose.Schema({
  isbn: { type: String, required: true, unique: true },
  top_similar: [String],
});

export default mongoose.model("SimilarBook", SimilarBookSchema);
