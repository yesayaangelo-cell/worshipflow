
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  // Use generateContent directly.
  // Initializing ai instance inside the method ensures the most up-to-date API key is used.
  async suggestSetlist(theme: string) {
    try {
      // Initialize with process.env.API_KEY exclusively as per guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a worship setlist for the theme: "${theme}". Include 4 songs with suggested musical keys.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                key: { type: Type.STRING },
                reason: { type: Type.STRING, description: "Why this song fits the theme" }
              },
              required: ["title", "key", "reason"]
            }
          }
        }
      });

      // The .text property is used to retrieve the generated string.
      return JSON.parse(response.text?.trim() || '[]');
    } catch (error) {
      console.error("Gemini suggestion failed:", error);
      return [];
    }
  }
}

export const geminiService = new GeminiService();
