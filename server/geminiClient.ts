import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const MODEL_NAME = "gemini-3.8-flash";

/**
 * Creates or retrieves a Gemini client with proper telemetry headers.
 * Uses process.env.GEMINI_API_KEY securely on the server-side.
 */
export function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export const ai = getGeminiClient();

/**
 * Executes a Gemini generateContent call with a 25-second timeout.
 * Runs completely server-side; API keys are never leaked to the browser.
 */
export async function generateContentWithTimeout(params: any, timeoutMs = 25000): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim().length === 0) {
    throw new Error("NO_API_KEY_CONFIGURED");
  }

  const client = new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  return Promise.race([client.models.generateContent(params), timeoutPromise]);
}
