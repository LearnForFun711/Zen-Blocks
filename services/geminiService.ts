
import { GoogleGenAI } from "@google/genai";

// Fix: Initialize GoogleGenAI strictly using process.env.API_KEY directly as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getZenTip = async (score: number, status: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player is playing a relaxing block-puzzle game. 
      Current Score: ${score}. Game Status: ${status}.
      Provide a short, healing, Zen-like quote or game tip (max 15 words) in a gentle, warm tone. 
      Help the user feel calm and focused.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    // Fix: Access the .text property of the response
    return response.text?.trim() || "Breathe in, breathe out. Every block finds its place.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The beauty of the game is in the journey itself.";
  }
};
