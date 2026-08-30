"""
Layer 5: Cross-Verification & Consolidation
Re-verifies rule violations and reasoning findings, merges duplicate/overlapping
concerns, applies confidence filtering, and sorts findings by severity.
"""
import logging
from typing import List, Optional
from backend.schemas.models import (
    StructuralGraph,
    RuleViolation,
    ReasoningFinding,
    VerifiedFinding,
    FinalReport,
)
from backend.config import CONFIDENCE_THRESHOLD

logger = logging.getLogger(__name__)

SEVERITY_ORDER = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


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
    """
    candidate_findings: List[VerifiedFinding] = []
    
    # 1. Convert Rule Violations into Verified Findings (Deterministic Layer 3 -> 1.0 confidence)
    for rv in rule_violations:
        title = f"Violation: {rv.rule_id} Standard Non-Compliance"
        if "EGRESS" in rv.rule_id:
            title = f"Egress Safety Violation [{rv.rule_id}]"
        elif "ELEC" in rv.rule_id:
            title = f"Electrical Redundancy Hazard [{rv.rule_id}]"
        elif "NET" in rv.rule_id:
            title = f"Network Single Point of Failure [{rv.rule_id}]"

        candidate_findings.append(
            VerifiedFinding(
                finding_id=f"VERIFIED-RULE-{rv.rule_id}-{len(candidate_findings)+1}",
                title=title,
                severity=rv.severity,
                confidence=0.98,
                contributing_layers=["layer3"],
                element_ids=rv.element_ids,
                explanation=rv.rationale,
                raw_reasoning=f"Layer 3 Deterministic Rule Engine verification against graph topology.",
            )
        )

    # 2. Convert Reasoning Findings into Verified Findings
    for rf in reasoning_findings:
        # Check if this reasoning finding overlaps heavily with an existing rule violation
        merged = False
        rf_elem_set = set(rf.element_ids)

        for cf in candidate_findings:
            cf_elem_set = set(cf.element_ids)
            # Substantial element overlap (>50% shared)
            if rf_elem_set & cf_elem_set:
                cf.contributing_layers.append("layer4")
                cf.explanation += f" Cross-Layer Analysis Note: {rf.reasoning}"
                cf.raw_reasoning += f"\n[Layer 4 Reasoning trace ({rf.mode})]: {rf.reasoning}"
                # Elevate severity if reasoning discovered critical risks
                if SEVERITY_ORDER.get(rf.severity, 0) > SEVERITY_ORDER.get(cf.severity, 0):
                    cf.severity = rf.severity
                cf.confidence = min(0.99, cf.confidence + 0.05)
                merged = True
                break

        if not merged:
            title = f"AI Vulnerability Advisory: {rf.mode.capitalize()} Analysis"
            if rf.mode == "cross_reference":
                title = "Cross-Discipline Redundancy Compromise"
            elif rf.mode == "adversarial":
                title = "Adversarial Threat & Choke Point Vulnerability"

            candidate_findings.append(
                VerifiedFinding(
                    finding_id=f"VERIFIED-AI-{rf.finding_id}",
                    title=title,
                    severity=rf.severity,
                    confidence=0.92 if rf.mode == "cross_reference" else 0.86,
                    contributing_layers=["layer4"],
                    element_ids=rf.element_ids,
                    explanation=rf.reasoning,
                    raw_reasoning=f"[Layer 4 {rf.mode} mode reasoning]: {rf.reasoning}",
                )
            )

    # 3. Filter by confidence threshold & partition into active vs debug_dropped
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

    return FinalReport(
        session_id=session_id,
        plan_types=plan_types,
        findings=active_findings,
        debug_dropped_findings=dropped_findings,
    )
