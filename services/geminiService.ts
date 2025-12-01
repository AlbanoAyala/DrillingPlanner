import { GoogleGenAI } from "@google/genai";
import { SimulationResult } from "../types";

// Note: In a real app, API_KEY should be in process.env. 
// For this demo, we assume the environment is set up correctly.
// The component calling this will handle the missing key error gracefully.

export const analyzeRiskWithGemini = async (result: SimulationResult): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a summary for the prompt
  const summary = {
    totalDays: result.totalTimeDays.toFixed(1),
    totalCost: (result.totalCost / 1000000).toFixed(2) + "M USD",
    maxDepth: result.timeCurve[result.timeCurve.length - 1].depth,
    activities: result.lines.map(l => ({
        activity: l.activity,
        duration: l.calculatedDuration.toFixed(1) + " hrs",
        cost: Math.round(l.calculatedCost)
    }))
  };

  const prompt = `
    You are a Senior Drilling Engineer. Analyze the following drilling program summary JSON.
    Identify top 3 operational risks and suggest 1 cost optimization opportunity.
    Keep it concise and professional.
    
    Data: ${JSON.stringify(summary)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to contact AI service.");
  }
};