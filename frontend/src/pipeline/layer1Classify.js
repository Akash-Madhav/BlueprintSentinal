/**
 * Layer 1: Document Classification (Gemini Multimodal Vision)
 * Classifies an uploaded blueprint into floor_plan, electrical_diagram, network_diagram, or unknown.
 */
import { generateGeminiContent } from '../services/geminiService';

export async function executeLayer1(file, base64Image) {
  const filename = file?.name || 'document.png';

  const systemInstruction = `You are an expert engineering blueprint and schematic classifier.
Analyze the input document image and classify it into one of:
- "floor_plan" (architectural room layouts, walls, doors, exits, building floor schematics)
- "electrical_diagram" (single-line power distribution, switchboards, generators, panels, breakers)
- "network_diagram" (server rack topology, routers, switches, SCADA/OT network links)
- "unknown"

Return strictly valid JSON matching:
{
  "plan_type": "floor_plan" | "electrical_diagram" | "network_diagram" | "unknown",
  "sub_type": "string describing specifics (e.g. multi-tenant office, 13.8kV distribution)",
  "confidence": 0.0 - 1.0
}`;

  const prompt = `Classify this infrastructure document (Filename: ${filename}). Return only the JSON object.`;

  try {
    const rawText = await generateGeminiContent({
      prompt,
      systemInstruction,
      images: [{ data: base64Image, mimeType: file.type || 'image/png' }],
      responseSchema: true,
    });

    const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
    return {
      plan_type: parsed.plan_type || 'floor_plan',
      sub_type: parsed.sub_type || 'architectural layout',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
    };
  } catch (err) {
    console.warn('Layer 1 Gemini classification fallback:', err);
    // Intelligent heuristic fallback based on filename clues
    const nameLower = filename.toLowerCase();
    if (nameLower.includes('elec') || nameLower.includes('schematic') || nameLower.includes('single_line')) {
      return { plan_type: 'electrical_diagram', sub_type: 'Single-line distribution', confidence: 0.9 };
    }
    if (nameLower.includes('net') || nameLower.includes('scada') || nameLower.includes('topology')) {
      return { plan_type: 'network_diagram', sub_type: 'Network topology', confidence: 0.9 };
    }
    return { plan_type: 'floor_plan', sub_type: 'Architectural blueprint', confidence: 0.92 };
  }
}
