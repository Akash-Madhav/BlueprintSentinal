/**
 * Client-Side Pipeline Orchestrator for BluePrint Sentinel.
 * Coordinates the five-layer verification pipeline directly in the browser using Google Gemini API.
 * Retains complete intermediate state for transparency and "Show Your Work" inspection.
 */
import { fileToBase64 } from '../services/geminiService';
import { executeLayer1 } from './layer1Classify';
import { executeLayer2 } from './layer2Extract';
import { executeLayer3 } from './layer3Rules';
import { executeLayer4 } from './layer4Reason';
import { executeLayer5 } from './layer5Verify';

export const CLIENT_SESSION_STORE = {};

export async function runClientPipeline({
  primaryFile,
  secondaryFile = null,
  mode = 'inspector',
  onProgress = () => {},
}) {
  const sessionId = 'bps-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);

  const intermediateData = {
    session_id: sessionId,
    mode,
    layer1: {},
    layer2: {},
    layer3: {},
    layer4: {},
    layer5: {},
  };

  // 0. Prepare Image Data (Base64 & object URLs for local display)
  const primaryBase64 = await fileToBase64(primaryFile);
  const primaryImageUrl = URL.createObjectURL(primaryFile);

  let secondaryBase64 = null;
  let secondaryImageUrl = null;
  if (secondaryFile) {
    secondaryBase64 = await fileToBase64(secondaryFile);
    secondaryImageUrl = URL.createObjectURL(secondaryFile);
  }

  // --- Layer 1: Document Classification ---
  onProgress(1, 'Layer 1: Document Classification');
  const primaryClass = await executeLayer1(primaryFile, primaryBase64);
  const planTypes = [primaryClass.plan_type];
  intermediateData.layer1.primary = primaryClass;

  let secondaryClass = null;
  if (secondaryFile) {
    secondaryClass = await executeLayer1(secondaryFile, secondaryBase64);
    planTypes.push(secondaryClass.plan_type);
    intermediateData.layer1.secondary = secondaryClass;
  }

  // --- Layer 2: Structural Extraction ---
  onProgress(2, 'Layer 2: Structural Extraction');
  const primaryGraph = await executeLayer2(primaryFile, primaryBase64, primaryClass.plan_type);
  intermediateData.layer2.primary = primaryGraph;

  let secondaryGraph = null;
  if (secondaryFile && secondaryClass) {
    secondaryGraph = await executeLayer2(secondaryFile, secondaryBase64, secondaryClass.plan_type);
    intermediateData.layer2.secondary = secondaryGraph;
  }

  // --- Layer 3: Deterministic Rule Verification ---
  onProgress(3, 'Layer 3: Deterministic Rule Audit');
  const ruleViolations = executeLayer3(primaryGraph);
  if (secondaryGraph) {
    const secViolations = executeLayer3(secondaryGraph);
    ruleViolations.push(...secViolations);
  }
  intermediateData.layer3.violations = ruleViolations;

  // --- Layer 4: AI Reasoning / Adversarial Red-Team ---
  onProgress(4, 'Layer 4: AI Reasoning & Adversarial Red-Team');
  const reasoningFindings = await executeLayer4(primaryGraph, ruleViolations, mode, secondaryGraph);
  intermediateData.layer4.findings = reasoningFindings;

  // --- Layer 5: Cross-Verification & Resilience Grading ---
  onProgress(5, 'Layer 5: Cross-Verification & Resilience Grading');
  const finalReport = executeLayer5({
    sessionId,
    planTypes,
    primaryGraph,
    ruleViolations,
    reasoningFindings,
    secondaryGraph,
    primaryImageUrl,
    secondaryImageUrl,
  });

  intermediateData.layer5.report = finalReport;

  // Store in memory for Show Your Work modal
  CLIENT_SESSION_STORE[sessionId] = intermediateData;

  return finalReport;
}

export function getClientLayerTrace(sessionId, layerNum) {
  const session = CLIENT_SESSION_STORE[sessionId];
  if (!session) return null;
  return session[`layer${layerNum}`] || null;
}
