
import { GoogleGenAI, Type } from "@google/genai";
import { AssetType } from '../types';

export const generateRoster = async (theme: string, count: number): Promise<Array<{name: string, stage: string}>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a list of ${count} fighting game characters based on the theme: "${theme}". 
    For each character, provide a creative name (compatible with MUGEN def files, no spaces ideally or snake_case) 
    and a fitting stage filename (e.g., stages/dojo.def).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            stage: { type: Type.STRING }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  return [];
};

export const searchAssets = async (query: string, type: AssetType): Promise<Array<{name: string, author: string, description: string, downloadUrl?: string}>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  let prompt = "";
  if (type === 'character') {
      prompt = `List 5 to 10 MUGEN/IKEMEN characters matching: "${query}".
      Prioritize content hosted on 'andersonkenya1.net', 'mugenarchive', or valid GitHub repos.
      Return JSON with name, author, brief description, and a direct download URL (zip/rar) if highly confident.`;
  } else if (type === 'stage') {
      prompt = `List 5 to 10 MUGEN stages matching: "${query}".
      Prioritize high quality stages.
      Return JSON with name, author, description (include if it's high res), and direct download URL.`;
  } else if (type === 'screenpack') {
      prompt = `List 5 to 10 MUGEN/IKEMEN screenpacks/motifs/full games matching: "${query}".
      Looking for motifs like 'Everything vs Everything', 'KOF style', 'IMT', etc.
      Prioritize 'andersonkenya1.net' or official releases.
      Return JSON with name, author, description (resolution, style), and direct download URL.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            author: { type: Type.STRING },
            description: { type: Type.STRING },
            downloadUrl: { type: Type.STRING, description: "Direct ZIP/RAR link if available" }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text);
  }
  return [];
};
