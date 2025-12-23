
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FileData, ChatMessage, GeminiContent } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

export const askQuestionAboutFiles = async (
  files: FileData[],
  history: ChatMessage[],
  question: string
): Promise<string> => {
  // Fix: Initializing GoogleGenAI following exact SDK guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare PDF parts
  const fileParts = files.map(file => ({
    inlineData: {
      mimeType: 'application/pdf',
      data: file.base64
    }
  }));

  // Prepare text history
  const historyParts = history.map(msg => ({
    text: `${msg.role === 'user' ? 'Question' : 'Answer'}: ${msg.content}`
  }));

  // Current question part
  const currentQuestionPart = {
    text: `Based on the provided PDF documents, please answer the following question: ${question}`
  };

  const systemInstruction = `You are a professional document assistant. 
    Users will provide multiple PDF files. 
    Analyze the contents of these files carefully. 
    Answer questions based ONLY on the information in these files. 
    If the information is not in the files, say you don't know based on the provided documents.
    Be concise but thorough. Cite the document names when referring to specific info.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [...fileParts, ...historyParts, currentQuestionPart]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Lower temperature for more factual extraction
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get an answer from the AI. Please check your files and try again.");
  }
};
