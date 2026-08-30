from typing import Literal, Dict, List, Tuple, Any
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
    attributes: Dict[str, Any] = {}
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class StructuralGraph(BaseModel):
    plan_type: str
    elements: List[GraphElement] = []
    adjacency: List[Tuple[str, str]] = []  # (element_id_1, element_id_2) pairs
    source_image_path: str = ""


class RuleViolation(BaseModel):
    rule_id: str
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: List[str]
    rationale: str


class ReasoningFinding(BaseModel):
    finding_id: str
    mode: Literal["inspector", "adversarial", "cross_reference"]
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: List[str]
    reasoning: str
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


class FinalReport(BaseModel):
    session_id: str
    plan_types: List[str]
    findings: List[VerifiedFinding]  # sorted severity desc, confidence desc
    debug_dropped_findings: List[VerifiedFinding] = []  # below threshold
