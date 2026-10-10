/**
 * Google Gemini API Service for BluePrint Sentinel.
 * Handles multimodal vision inference (image + text) directly from the client.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Retrieves the currently active Google Gemini API Key from:
 * 1. localStorage (user entered in UI)
 * 2. Vite environment variable VITE_GEMINI_API_KEY
 */
export function getGeminiApiKey() {
  const localKey = localStorage.getItem('gemini_api_key');
  if (localKey && localKey.trim()) {
    return localKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Persists the user's Gemini API key to localStorage.
 */
export function setGeminiApiKey(key) {
  if (key) {
    localStorage.setItem('gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('gemini_api_key');
  }
}

/**
 * Converts a browser File or Blob into base64 format for Gemini inlineData.
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Tests if the provided API key is valid.
 */
export async function testGeminiApiKey(apiKey) {
  if (!apiKey) return { valid: false, message: 'No API key provided.' };
  try {
    const url = `${GEMINI_API_BASE}/${DEFAULT_GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with OK.' }] }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, message: err?.error?.message || `HTTP ${res.status}` };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

/**
 * Calls Gemini with multimodal content (image base64 + text prompt).
 */
export async function generateGeminiContent({
  prompt,
  systemInstruction = '',
  images = [], // Array of { data: base64String, mimeType: 'image/png' }
  model = DEFAULT_GEMINI_MODEL,
  responseSchema = null,
}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API Key is missing. Please enter your API key in the top navigation bar.');
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const parts = [];

  // Add images first
  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType || 'image/png',
        data: img.data,
      },
    });
  }

  // Add user prompt
  parts.push({ text: prompt });

  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  if (responseSchema) {
    payload.generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Gemini API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const result = await response.json();
  const candidate = result?.candidates?.[0];
  const textOutput = candidate?.content?.parts?.[0]?.text || '';

  return textOutput;
}
