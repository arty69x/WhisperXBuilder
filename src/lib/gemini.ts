import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import type { GeminiModelId } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

// System Sync Utility
export const writeToSystem = async (filePath: string, content: string) => {
  const token = localStorage.getItem("whisperx_token");
  if (!token) throw new Error("Unauthorized");
  await axios.post("/api/system/write", { filePath, content }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const GEMINI_MODELS = [
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash ✦", supportsThinking: true  },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro",    supportsThinking: true  },
  { id: "gemini-1.5-flash",       label: "Gemini 1.5 Flash",  supportsThinking: false },
  { id: "gemini-1.5-pro",         label: "Gemini 1.5 Pro",    supportsThinking: false },
] as const;

export const DEFAULT_MODEL: GeminiModelId = "gemini-3-flash-preview";

export interface TextOpts {
  model?: GeminiModelId;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  imagePart?: { mimeType: string; data: string };
}

export async function geminiText(prompt: string, opts: TextOpts = {}): Promise<string> {
  const { model = DEFAULT_MODEL, systemInstruction, temperature = 0.7, imagePart } = opts;
  
  const contents: any[] = [];
  if (imagePart) {
    contents.push({ inlineData: { mimeType: imagePart.mimeType, data: imagePart.data } });
  }
  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: contents }],
    config: {
      systemInstruction,
      temperature,
    }
  });

  return response.text || "";
}

export async function geminiStream(prompt: string, opts: {
  model?: GeminiModelId;
  systemInstruction?: string;
  temperature?: number;
  thinkingBudget?: number;
  imagePart?: { mimeType: string; data: string };
  onChunk: (text: string, isThinking?: boolean) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}) {
  const { model = DEFAULT_MODEL, systemInstruction, temperature = 0.7, onChunk, onDone, onError, imagePart } = opts;
  
  try {
    const contents: any[] = [];
    if (imagePart) {
      contents.push({ inlineData: { mimeType: imagePart.mimeType, data: imagePart.data } });
    }
    contents.push({ text: prompt });

    const result = await ai.models.generateContentStream({
      model,
      contents: [{ role: 'user', parts: contents }],
      config: {
        systemInstruction,
        temperature,
      }
    });

    let fullText = "";
    for await (const chunk of result) {
      const text = chunk.text || "";
      fullText += text;
      onChunk(text, false); 
    }
    onDone(fullText);
  } catch (e) {
    onError(e instanceof Error ? e : new Error(String(e)));
  }
}

export async function geminiJson<T>(prompt: string, opts: { model?: GeminiModelId; fallback: T; systemInstruction?: string }): Promise<T> {
  const raw = await geminiText(`${prompt}\n\nReturn ONLY valid JSON. No markdown fences.`, {
    ...opts,
    temperature: 0.1,
  });
  const cleaned = raw.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return opts.fallback;
  }
}
