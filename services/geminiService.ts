
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAITheme = async (userPrompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest a visual theme for a 3D particle system based on this mood: "${userPrompt}". 
    Choose from shapes: heart, flower, star, firework, planet. 
    Provide a hexadecimal color and a recommended particle size (0.01 to 0.1).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          color: { type: Type.STRING },
          shape: { type: Type.STRING, enum: ['heart', 'flower', 'star', 'firework', 'planet'] },
          particleSize: { type: Type.NUMBER },
          reasoning: { type: Type.STRING }
        },
        required: ['color', 'shape', 'particleSize']
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
};
