from typing import Literal, Dict, List, Tuple, Any, Optional
from pydantic import BaseModel, Field


class PlanClassification(BaseModel):
    plan_type: Literal["floor_plan", "electrical_diagram", "network_diagram", "unknown"]
    sub_type: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class GraphElement(BaseModel):
    id: str
    kind: Literal["room", "wall", "door", "exit", "symbol", "panel", "node", "edge"]
    label: str | None = None
    bbox: Tuple[float, float, float, float] | None = None  # x1, y1, x2, y2 in image pixels
    normalized_bbox: Tuple[float, float, float, float] | None = None  # 0.0 - 1.0 (ymin, xmin, ymax, xmax)
    attributes: Dict[str, Any] = {}
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class StructuralGraph(BaseModel):
    plan_type: str
    elements: List[GraphElement] = []
    adjacency: List[Tuple[str, str]] = []  # (element_id_1, element_id_2) pairs
    source_image_path: str = ""
    image_width: int = 1200
    image_height: int = 900


class RuleViolation(BaseModel):
    rule_id: str
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: List[str]
    rationale: str
    regulatory_code: str = ""
    remediation: str = ""


class ReasoningFinding(BaseModel):
    finding_id: str
    mode: Literal["inspector", "adversarial", "cross_reference"]
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: List[str]
    reasoning: str
    regulatory_code: str = ""
    remediation: str = ""
    source_layer: Literal["layer4"] = "layer4"


class VerifiedFinding(BaseModel):
    finding_id: str
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    confidence: float = Field(ge=0.0, le=1.0)
    contributing_layers: List[Literal["layer3", "layer4"]]
    element_ids: List[str]
    explanation: str
    raw_reasoning: str
    regulatory_code: str = ""
    remediation: str = ""
    impact_category: Literal["life_safety", "power_resilience", "cyber_security", "operational_continuity"] = "life_safety"
    associated_bboxes: List[Dict[str, Any]] = []


class ResilienceMetrics(BaseModel):
    overall_score: int = Field(ge=0, le=100)  # 0-100 score
    grade: Literal["A+", "A", "B", "C", "D", "F"] = "B"
    discipline_scores: Dict[str, int] = {}  # architectural, electrical, cyber_physical
    risk_matrix: Dict[str, int] = {}  # critical, high, medium, low counts
    executive_summary: str = ""


class FinalReport(BaseModel):
    session_id: str
    plan_types: List[str]
    findings: List[VerifiedFinding]  # sorted severity desc, confidence desc
    debug_dropped_findings: List[VerifiedFinding] = []  # below threshold
    resilience_metrics: ResilienceMetrics = Field(default_factory=lambda: ResilienceMetrics(overall_score=85, grade="B"))
    primary_image_url: Optional[str] = None
    secondary_image_url: Optional[str] = None
    elements_manifest: List[Dict[str, Any]] = []

