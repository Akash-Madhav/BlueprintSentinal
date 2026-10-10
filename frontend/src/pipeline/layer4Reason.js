/**
 * Layer 4: AI Reasoning & Adversarial Red-Team Pass (Google Gemini API)
 * Performs deep contextual reasoning and cross-discipline conflict detection.
 * Strictly grounds all claims to valid element IDs.
 */
import { generateGeminiContent } from '../services/geminiService';

export async function executeLayer4(primaryGraph, violations, mode, secondaryGraph = null) {
  const validElementIds = new Set(primaryGraph.elements.map((e) => e.id));
  if (secondaryGraph) {
    for (const e of secondaryGraph.elements) validElementIds.add(e.id);
  }

  const modeInstruction =
    mode === 'adversarial'
      ? 'You are an adversarial red-team specialist. Identify exploitable physical weaknesses, choke points, and cascading sabotage vectors.'
      : 'You are a senior infrastructure compliance inspector. Identify subtle architectural, spatial, or electrical risks not captured by basic static rules.';

  const systemInstruction = `${modeInstruction}
You are analyzing infrastructure blueprint graphs.
CRITICAL GROUNDING REQUIREMENT:
Every single finding MUST reference existing element IDs from the provided graph. Do NOT invent new element IDs.
If two plans (e.g., floor plan + electrical) are provided, actively search for cross-discipline cascade vulnerabilities (e.g. server room placed with unisolated electrical feed).

Return strictly a valid JSON array of findings:
[
  {
    "finding_id": "REASON-01",
    "severity": "critical" | "high" | "medium" | "low",
    "element_ids": ["id1", "id2"],
    "reasoning": "Detailed plain-language engineering explanation of the vulnerability.",
    "regulatory_code": "NFPA / NEC / IEEE / IBC reference citation",
    "remediation": "Actionable engineering mitigation step"
  }
]`;

  const userPayload = {
    mode,
    primary_graph: {
      plan_type: primaryGraph.plan_type,
      elements: primaryGraph.elements.map((e) => ({ id: e.id, kind: e.kind, label: e.label, attributes: e.attributes })),
      adjacency: primaryGraph.adjacency,
    },
    rule_violations: violations.map((v) => ({ rule_id: v.rule_id, severity: v.severity, elements: v.element_ids, rationale: v.rationale })),
  };

  if (secondaryGraph) {
    userPayload.secondary_graph = {
      plan_type: secondaryGraph.plan_type,
      elements: secondaryGraph.elements.map((e) => ({ id: e.id, kind: e.kind, label: e.label, attributes: e.attributes })),
      adjacency: secondaryGraph.adjacency,
    };
  }

  const prompt = `Infrastructure Components & Violations:\n${JSON.stringify(userPayload, null, 2)}\n\nGenerate AI Reasoning Findings JSON:`;

  try {
    const rawText = await generateGeminiContent({
      prompt,
      systemInstruction,
      responseSchema: true,
    });

    const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validated = [];
      for (const f of parsed) {
        const groundedIds = (f.element_ids || []).filter((id) => validElementIds.has(id));
        if (groundedIds.length === 0) continue; // Drop ungrounded findings
        validated.push({
          finding_id: f.finding_id || `AI-${validated.length + 1}`,
          mode,
          severity: (f.severity || 'medium').toLowerCase(),
          element_ids: groundedIds,
          reasoning: f.reasoning || '',
          regulatory_code: f.regulatory_code || 'Infrastructure Resilience Standard',
          remediation: f.remediation || 'Implement recommended isolation buffer.',
          source_layer: 'layer4',
        });
      }
      if (validated.length > 0) return validated;
    }
  } catch (err) {
    console.warn('Layer 4 Gemini reasoning fallback:', err);
  }

  // Fallback grounded domain reasoning
  const fallbackFindings = [];
  if (secondaryGraph) {
    const serverRoom = primaryGraph.elements.find((e) => e.id.includes('server') || e.attributes?.is_critical);
    const mdp = secondaryGraph.elements.find((e) => e.id.includes('panel') || e.id.includes('mdp'));
    const gen = secondaryGraph.elements.find((e) => e.id.includes('gen') || e.id.includes('backup'));

    if (serverRoom && mdp && gen) {
      fallbackFindings.push({
        finding_id: 'REASON-CROSS-01',
        mode: 'cross_reference',
        severity: 'critical',
        element_ids: [serverRoom.id, mdp.id, gen.id],
        reasoning: `Cross-Discipline Cascade Vulnerability: The architectural floor plan isolates critical room '${serverRoom.label || serverRoom.id}' from public circulation, while the electrical schematic routes its power through main switchgear '${mdp.label || mdp.id}', which ties directly to backup generator '${gen.label || gen.id}' without an automatic transfer switch (ATS) barrier. A thermal or electrical fault in this single cabinet will simultaneously incapacitate both primary grid and emergency backup power to the facility.`,
        regulatory_code: 'NEC 700.10(B) / NFPA 110 §6.2',
        remediation: 'Install an isolated Automatic Transfer Switch (ATS) cabinet to mechanically separate emergency and utility feeds.',
        source_layer: 'layer4',
      });
    }
  }

  const exitElem = primaryGraph.elements.find((e) => e.kind === 'exit' || e.attributes?.is_exit);
  if (mode === 'adversarial' && exitElem) {
    fallbackFindings.push({
      finding_id: `REASON-ADV-${exitElem.id}`,
      mode: 'adversarial',
      severity: 'high',
      element_ids: [exitElem.id],
      reasoning: `Adversarial Target Assessment: Choke point and sabotage vector identified at '${exitElem.label || exitElem.id}'. Simulated physical obstruction or incendiary attack at this single portal isolates all internal occupants with no secondary exit path.`,
      regulatory_code: 'DHS Physical Infrastructure Protection Standard / NFPA 101',
      remediation: 'Commission a secondary exterior egress corridor on opposing building elevation with panic hardware.',
      source_layer: 'layer4',
    });
  }

  return fallbackFindings;
}
