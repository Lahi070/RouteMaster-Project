import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, RecommendationExplainability } from '../types';

export const getTravelRecommendations = async (prefs: UserPreferences): Promise<RecommendationExplainability[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate travel recommendations for Sri Lanka based on these preferences: ${JSON.stringify(prefs)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              destinationId: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              factors: {
                type: Type.OBJECT,
                properties: {
                  interestMatch: { type: Type.NUMBER },
                  rating: { type: Type.NUMBER },
                  budgetFit: { type: Type.NUMBER },
                  proximity: { type: Type.NUMBER }
                }
              },
              reasoning: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [
      {
        destinationId: '1',
        matchScore: 95,
        factors: { interestMatch: 98, rating: 95, budgetFit: 85, proximity: 90 },
        reasoning: "Sigiriya matches your interest in historical grandeur and heritage."
      },
      {
        destinationId: '2',
        matchScore: 88,
        factors: { interestMatch: 92, rating: 90, budgetFit: 95, proximity: 75 },
        reasoning: "Kandy aligns with your spiritual and cultural travel style."
      }
    ];
  }
};