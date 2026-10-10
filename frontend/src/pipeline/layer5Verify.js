/**
 * Layer 5: Cross-Verification, Consolidation & Resilience Grading
 * Consolidates Layer 3 & Layer 4 findings, computes the resilience scorecard,
 * maps visual bounding boxes, and generates the final audit report.
 */

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
const SEVERITY_WEIGHTS = { critical: 25, high: 12, medium: 5, low: 2 };
const CONFIDENCE_THRESHOLD = 0.5;

export function executeLayer5({
  sessionId,
  planTypes,
  primaryGraph,
  ruleViolations,
  reasoningFindings,
  secondaryGraph = null,
  primaryImageUrl = null,
  secondaryImageUrl = null,
}) {
  // Master element lookup
  const elementMap = {};
  for (const elem of primaryGraph.elements) {
    elementMap[elem.id] = elem;
  }
  if (secondaryGraph) {
    for (const elem of secondaryGraph.elements) {
      elementMap[elem.id] = elem;
    }
  }

  const candidateFindings = [];

  // 1. Convert Layer 3 Rule Violations into candidate findings
  for (const rv of ruleViolations) {
    let title = `Violation: ${rv.rule_id} Standard Non-Compliance`;
    let impactCategory = 'life_safety';
    if (rv.rule_id.includes('EGRESS')) {
      title = `Egress Safety Violation [${rv.rule_id}]`;
      impactCategory = 'life_safety';
    } else if (rv.rule_id.includes('ELEC')) {
      title = `Electrical Redundancy Hazard [${rv.rule_id}]`;
      impactCategory = 'power_resilience';
    } else if (rv.rule_id.includes('NET')) {
      title = `Cyber-Physical Single Point of Failure [${rv.rule_id}]`;
      impactCategory = 'cyber_security';
    }

    const associatedBboxes = rv.element_ids.map((id) => elementMap[id]).filter(Boolean);

    candidateFindings.push({
      finding_id: `VERIFIED-RULE-${rv.rule_id}-${candidateFindings.length + 1}`,
      title,
      severity: rv.severity,
      confidence: 0.98,
      contributing_layers: ['layer3'],
      element_ids: rv.element_ids,
      explanation: rv.rationale,
      raw_reasoning: 'Layer 3 Deterministic Rule Engine verification against graph topology.',
      regulatory_code: rv.regulatory_code || 'Codified Engineering Standard',
      remediation: rv.remediation || 'Remediate according to applicable safety standard.',
      impact_category: impactCategory,
      associated_bboxes: associatedBboxes,
    });
  }

  // 2. Merge Layer 4 Reasoning findings
  for (const rf of reasoningFindings) {
    let merged = false;
    const rfElemSet = new Set(rf.element_ids);

    for (const cf of candidateFindings) {
      const cfElemSet = new Set(cf.element_ids);
      const overlap = [...rfElemSet].some((id) => cfElemSet.has(id));

      if (overlap) {
        cf.contributing_layers.push('layer4');
        cf.explanation += ` Cross-Layer Advisory: ${rf.reasoning}`;
        cf.raw_reasoning += `\n[Layer 4 Reasoning trace (${rf.mode})]: ${rf.reasoning}`;
        if (SEVERITY_ORDER[rf.severity] > SEVERITY_ORDER[cf.severity]) {
          cf.severity = rf.severity;
        }
        if (rf.regulatory_code && !cf.regulatory_code) {
          cf.regulatory_code = rf.regulatory_code;
        }
        if (rf.remediation) {
          cf.remediation = rf.remediation;
        }
        cf.confidence = Math.min(0.99, cf.confidence + 0.05);

        for (const eid of rf.element_ids) {
          if (elementMap[eid] && !cf.associated_bboxes.some((b) => b.id === eid)) {
            cf.associated_bboxes.push(elementMap[eid]);
          }
        }
        merged = true;
        break;
      }
    }

    if (!merged) {
      let title = `AI Vulnerability Advisory: ${rf.mode} Analysis`;
      let impactCategory = 'life_safety';
      if (rf.mode === 'cross_reference') {
        title = 'Cross-Discipline Cascade Compromise';
        impactCategory = 'power_resilience';
      } else if (rf.mode === 'adversarial') {
        title = 'Adversarial Threat & Sabotage Vector';
        impactCategory = 'operational_continuity';
      }

      const associatedBboxes = rf.element_ids.map((id) => elementMap[id]).filter(Boolean);

      candidateFindings.push({
        finding_id: `VERIFIED-AI-${rf.finding_id}`,
        title,
        severity: rf.severity,
        confidence: rf.mode === 'cross_reference' ? 0.94 : 0.88,
        contributing_layers: ['layer4'],
        element_ids: rf.element_ids,
        explanation: rf.reasoning,
        raw_reasoning: `[Layer 4 ${rf.mode} mode reasoning]: ${rf.reasoning}`,
        regulatory_code: rf.regulatory_code || 'Infrastructure Resilience Framework',
        remediation: rf.remediation || 'Implement recommended physical/electrical mitigation.',
        impact_category: impactCategory,
        associated_bboxes: associatedBboxes,
      });
    }
  }

  // 3. Filter by confidence threshold & sort
  const activeFindings = candidateFindings
    .filter((f) => f.confidence >= CONFIDENCE_THRESHOLD)
    .sort((a, b) => {
      const diff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (diff !== 0) return diff;
      return b.confidence - a.confidence;
    });

  const droppedFindings = candidateFindings.filter((f) => f.confidence < CONFIDENCE_THRESHOLD);

  // 4. Compute Resilience Score & Grade
  const riskCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of activeFindings) {
    const sev = f.severity.toLowerCase();
    if (riskCounts[sev] !== undefined) riskCounts[sev]++;
  }

  const penalty = Object.keys(riskCounts).reduce((acc, k) => acc + riskCounts[k] * SEVERITY_WEIGHTS[k], 0);
  const overallScore = Math.max(5, Math.min(100, 100 - penalty));

  let grade = 'B';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  const archPen = activeFindings
    .filter((f) => f.impact_category === 'life_safety')
    .reduce((acc, f) => acc + (SEVERITY_WEIGHTS[f.severity] || 0), 0);
  const elecPen = activeFindings
    .filter((f) => f.impact_category === 'power_resilience')
    .reduce((acc, f) => acc + (SEVERITY_WEIGHTS[f.severity] || 0), 0);
  const cyberPen = activeFindings
    .filter((f) => ['cyber_security', 'operational_continuity'].includes(f.impact_category))
    .reduce((acc, f) => acc + (SEVERITY_WEIGHTS[f.severity] || 0), 0);

  const disciplineScores = {
    architectural: Math.max(10, Math.min(100, 100 - archPen)),
    electrical: Math.max(10, Math.min(100, 100 - elecPen)),
    cyber_physical: Math.max(10, Math.min(100, 100 - cyberPen)),
  };

  let summary = `AUDIT COMPLETED: Composite resilience score ${overallScore}/100 (Grade ${grade}).`;
  if (riskCounts.critical > 0) {
    summary = `AUDIT ALERT: ${riskCounts.critical} Critical and ${riskCounts.high} High-severity vulnerability vectors identified. Immediate life safety or power cascade failure risks present. Plan approval cannot proceed without installing automatic transfer switch isolation and redundant emergency egress capacity.`;
  } else if (riskCounts.high > 0) {
    summary = `AUDIT CAUTION: ${riskCounts.high} High-severity architectural or circuit compliance issues detected. Secondary evacuation pathways and branch load balancing required prior to regulatory submission.`;
  }

  const elementsManifest = Object.values(elementMap);

  return {
    session_id: sessionId,
    plan_types: planTypes,
    findings: activeFindings,
    debug_dropped_findings: droppedFindings,
    resilience_metrics: {
      overall_score: overallScore,
      grade,
      discipline_scores: disciplineScores,
      risk_matrix: riskCounts,
      executive_summary: summary,
    },
    primary_image_url: primaryImageUrl,
    secondary_image_url: secondaryImageUrl,
    elements_manifest: elementsManifest,
  };
}
