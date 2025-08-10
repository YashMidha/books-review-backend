import axios from "axios";
import { isbn13to10 } from "./isbnUtil.js";

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

export const getGoogleAPI = async (isbn) => {
    try{
        const url = `${GOOGLE_BOOKS_BASE_URL}?q=isbn:${isbn}&key=${process.env.BOOKS_API_KEY}`;
        const result = await axios.get(url);
        return result.data.items || [];

    } catch(err){
        console.error("Google API error:", err);
        return [];
    }
}

export const searchGoogleAPI = async (term) => {
  try {
    const axios = (await import("axios")).default;
    const url = `${GOOGLE_BOOKS_BASE_URL}?q=${encodeURIComponent(term)}&maxResults=40&key=${process.env.BOOKS_API_KEY}`;
    const result = await axios.get(url);
    return result.data.items || [];
  } catch (err) {
    console.error("Google API search error:", err);
    return [];
  }
};

export const getIsbnFromVolumeInfo = (volumeInfo) => {
  if (!volumeInfo.industryIdentifiers) return null;
  const isbn10 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_10")?.identifier;
  const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13")?.identifier;
  if (isbn10){
    return isbn10;
  }
return isbn13to10(isbn13) || null;
};