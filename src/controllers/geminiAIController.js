import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export const enchanceReview = async (req, res) => {
    try {
        const { review, bookTitle } = req.body;

        if (!review || !bookTitle) {
            return res.status(400).json({ error: "Review and bookTitle are required" });
        }

        const prompt = `Enhance the following review for the book titled "${bookTitle}". Make it more descriptive but ensure that the desciption stays true to the original review (i.e. do not add more content to the review):\n\n"${review} Note - Only return one version of the review. Do not return any unnessary comments as the reponse will be shown to the users using this service."`;

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            }
        });

        const enhanced = response.text;

        res.json({ enhancedReview: enhanced.trim() });

    } catch (error) {
        console.error("Gemini API error:", error.message);
        res.status(500).json({ error: "Failed to enhance review" });
    }
};