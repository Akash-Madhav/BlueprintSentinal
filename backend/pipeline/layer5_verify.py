"""
Layer 5: Cross-Verification, Consolidation & Resilience Grading
Re-verifies rule violations and reasoning findings, merges duplicate/overlapping
concerns, populates associated bounding boxes for visual overlay, and calculates
an industrial Infrastructure Resilience Score and Grade.
"""
import logging
from typing import List, Optional, Dict, Any
from backend.schemas.models import (
    StructuralGraph,
    RuleViolation,
    ReasoningFinding,
    VerifiedFinding,
    FinalReport,
    ResilienceMetrics,
)
from backend.config import CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

SEVERITY_ORDER = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}

SEVERITY_WEIGHTS = {
    "critical": 25,
    "high": 12,
    "medium": 5,
    "low": 2,
}


def _compute_resilience_metrics(findings: List[VerifiedFinding], plan_types: List[str]) -> ResilienceMetrics:
    """
    Computes overall resilience score (0-100), letter grade (A+ to F),
    discipline breakdowns, and executive summary.
    """
    risk_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for f in findings:
        sev = f.severity.lower()
        if sev in risk_counts:
            risk_counts[sev] += 1

    total_penalty = sum(risk_counts[k] * SEVERITY_WEIGHTS[k] for k in risk_counts)
    overall_score = max(5, min(100, 100 - total_penalty))

    if overall_score >= 95:
        grade = "A+"
    elif overall_score >= 85:
        grade = "A"
    elif overall_score >= 70:
        grade = "B"
    elif overall_score >= 55:
        grade = "C"
    elif overall_score >= 40:
        grade = "D"
    else:
        grade = "F"

    # Discipline sub-scores
    arch_pen = sum(SEVERITY_WEIGHTS.get(f.severity, 0) for f in findings if f.impact_category == "life_safety")
    elec_pen = sum(SEVERITY_WEIGHTS.get(f.severity, 0) for f in findings if f.impact_category == "power_resilience")
    cyber_pen = sum(SEVERITY_WEIGHTS.get(f.severity, 0) for f in findings if f.impact_category in ["cyber_security", "operational_continuity"])

    discipline_scores = {
        "architectural": max(10, min(100, 100 - arch_pen)),
        "electrical": max(10, min(100, 100 - elec_pen)),
        "cyber_physical": max(10, min(100, 100 - cyber_pen)),
    }

    # Executive Summary text
    crit_count = risk_counts["critical"]
    high_count = risk_counts["high"]
    if crit_count > 0:
        summary = (
            f"AUDIT ALERT: {crit_count} Critical and {high_count} High-severity vulnerability vectors detected. "
            f"Immediate life safety or power cascade failure risks present. Plan approval cannot proceed without "
            f"implementing isolated emergency ATS switching and redundant egress capacity."
        )
    elif high_count > 0:
        summary = (
            f"AUDIT CAUTION: Plan presents {high_count} High-severity architectural or circuit compliance issues. "
            f"Secondary evacuation and branch load balancing required prior to regulatory submission."
        )
    else:
        summary = (
            f"AUDIT PASS: Infrastructure demonstrates high baseline compliance ({overall_score}/100, Grade {grade}). "
            f"Minor advisories noted for continuous operational resilience."
        )

    return ResilienceMetrics(
        overall_score=overall_score,
        grade=grade,
        discipline_scores=discipline_scores,
        risk_matrix=risk_counts,
        executive_summary=summary,
    )


def execute_layer5(
    session_id: str,
    plan_types: List[str],
    graph: StructuralGraph,
    rule_violations: List[RuleViolation],
    reasoning_findings: List[ReasoningFinding],
    second_graph: Optional[StructuralGraph] = None,
) -> FinalReport:
    """
    Consolidates Layer 3 and Layer 4 findings into a verified, ranked FinalReport.
    Associates bounding boxes to each finding for interactive visual blueprint inspection.
    """
    candidate_findings: List[VerifiedFinding] = []

    # Build master element lookup for bounding box mapping
    element_map: Dict[str, Dict[str, Any]] = {}
    for elem in graph.elements:
        element_map[elem.id] = {
            "id": elem.id,
            "label": elem.label or elem.id,
            "kind": elem.kind,
            "bbox": elem.bbox,
            "normalized_bbox": elem.normalized_bbox,
            "attributes": elem.attributes,
        }
    if second_graph:
        for elem in second_graph.elements:
            element_map[elem.id] = {
                "id": elem.id,
                "label": elem.label or elem.id,
                "kind": elem.kind,
                "bbox": elem.bbox,
                "normalized_bbox": elem.normalized_bbox,
                "attributes": elem.attributes,
            }

    # 1. Convert Rule Violations into Verified Findings
    for rv in rule_violations:
        title = f"Violation: {rv.rule_id} Standard Non-Compliance"
        impact_cat = "life_safety"
        if "EGRESS" in rv.rule_id:
            title = f"Egress Safety Violation [{rv.rule_id}]"
            impact_cat = "life_safety"
        elif "ELEC" in rv.rule_id:
            title = f"Electrical Redundancy Hazard [{rv.rule_id}]"
            impact_cat = "power_resilience"
        elif "NET" in rv.rule_id:
            title = f"Cyber-Physical Single Point of Failure [{rv.rule_id}]"
            impact_cat = "cyber_security"

        associated_boxes = [element_map[eid] for eid in rv.element_ids if eid in element_map]

        candidate_findings.append(
            VerifiedFinding(
                finding_id=f"VERIFIED-RULE-{rv.rule_id}-{len(candidate_findings)+1}",
                title=title,
                severity=rv.severity,
                confidence=0.98,
                contributing_layers=["layer3"],
                element_ids=rv.element_ids,
                explanation=rv.rationale,
                raw_reasoning="Layer 3 Deterministic Rule Engine verification against graph topology.",
                regulatory_code=rv.regulatory_code or "Codified Engineering Standard",
                remediation=rv.remediation or "Remediate according to applicable safety standard.",
                impact_category=impact_cat,
                associated_bboxes=associated_boxes,
            )
        )

    # 2. Convert Reasoning Findings into Verified Findings & Merge
    for rf in reasoning_findings:
        merged = False
        rf_elem_set = set(rf.element_ids)

        for cf in candidate_findings:
            cf_elem_set = set(cf.element_ids)
            if rf_elem_set & cf_elem_set:
                cf.contributing_layers.append("layer4")
                cf.explanation += f" Cross-Layer Advisory: {rf.reasoning}"
                cf.raw_reasoning += f"\n[Layer 4 Reasoning trace ({rf.mode})]: {rf.reasoning}"
                if SEVERITY_ORDER.get(rf.severity, 0) > SEVERITY_ORDER.get(cf.severity, 0):
                    cf.severity = rf.severity
                if rf.regulatory_code and not cf.regulatory_code:
                    cf.regulatory_code = rf.regulatory_code
                if rf.remediation:
                    cf.remediation = rf.remediation
                cf.confidence = min(0.99, cf.confidence + 0.05)
                # Ensure all bboxes are attached
                for eid in rf.element_ids:
                    if eid in element_map and not any(b["id"] == eid for b in cf.associated_bboxes):
                        cf.associated_bboxes.append(element_map[eid])
                merged = True
                break

        if not merged:
            title = f"AI Vulnerability Advisory: {rf.mode.capitalize()} Analysis"
            impact_cat = "life_safety"
            if rf.mode == "cross_reference":
                title = "Cross-Discipline Cascade Compromise"
                impact_cat = "power_resilience"
            elif rf.mode == "adversarial":
                title = "Adversarial Threat & Sabotage Vector"
                impact_cat = "operational_continuity"

            associated_boxes = [element_map[eid] for eid in rf.element_ids if eid in element_map]

            candidate_findings.append(
                VerifiedFinding(
                    finding_id=f"VERIFIED-AI-{rf.finding_id}",
                    title=title,
                    severity=rf.severity,
                    confidence=0.94 if rf.mode == "cross_reference" else 0.88,
                    contributing_layers=["layer4"],
                    element_ids=rf.element_ids,
                    explanation=rf.reasoning,
                    raw_reasoning=f"[Layer 4 {rf.mode} mode reasoning]: {rf.reasoning}",
                    regulatory_code=rf.regulatory_code or "Infrastructure Resilience Framework",
                    remediation=rf.remediation or "Implement recommended physical/electrical mitigation.",
                    impact_category=impact_cat,
                    associated_bboxes=associated_boxes,
                )
            )

    # 3. Filter by confidence threshold
    active_findings: List[VerifiedFinding] = []
    dropped_findings: List[VerifiedFinding] = []

    for f in candidate_findings:
        if f.confidence >= CONFIDENCE_THRESHOLD:
            active_findings.append(f)
        else:
            dropped_findings.append(f)

    # 4. Sort active findings by severity descending, then confidence descending
    active_findings.sort(
        key=lambda x: (SEVERITY_ORDER.get(x.severity, 0), x.confidence),
        reverse=True,
    )

    # 5. Compute Resilience Metrics
    metrics = _compute_resilience_metrics(active_findings, plan_types)

    # 6. Master manifest of all detected elements for blueprint overlays
    elements_manifest = list(element_map.values())

    return FinalReport(
        session_id=session_id,
        plan_types=plan_types,
        findings=active_findings,
        debug_dropped_findings=dropped_findings,
        resilience_metrics=metrics,
        elements_manifest=elements_manifest,
    )
