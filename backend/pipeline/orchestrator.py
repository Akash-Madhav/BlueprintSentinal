"""
Pipeline Orchestrator for BluePrint Sentinel.
Runs the 5-layer pipeline in sequence, maintains intermediate state for inspection.
"""
import logging
import uuid
from typing import Dict, Any, List, Literal, Optional
from backend.schemas.models import FinalReport, PlanClassification, StructuralGraph
from backend.pipeline.layer1_classify import execute_layer1
from backend.pipeline.layer2_extract import execute_layer2
from backend.pipeline.layer3_rules import execute_layer3
from backend.pipeline.layer4_reason import execute_layer4
from backend.pipeline.layer5_verify import execute_layer5

logger = logging.getLogger(__name__)

# In-memory session store for intermediate layer JSON inspection ("show your work" panel)
SESSION_STORE: Dict[str, Dict[str, Any]] = {}


def run_pipeline(
    primary_image_path: str,
    secondary_image_path: Optional[str] = None,
    mode: Literal["inspector", "adversarial"] = "inspector",
) -> FinalReport:
    """
    Executes the five-layer audit pipeline across one or two input documents.
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Starting audit session {session_id} in {mode} mode.")

    intermediate_data: Dict[str, Any] = {
        "session_id": session_id,
        "mode": mode,
        "layer1": {},
        "layer2": {},
        "layer3": {},
        "layer4": {},
        "layer5": {},
    }

    # --- Layer 1: Classification ---
    primary_class = execute_layer1(primary_image_path)
    plan_types = [primary_class.plan_type]
    intermediate_data["layer1"]["primary"] = primary_class.model_dump()

    secondary_class = None
    if secondary_image_path:
        secondary_class = execute_layer1(secondary_image_path)
        plan_types.append(secondary_class.plan_type)
        intermediate_data["layer1"]["secondary"] = secondary_class.model_dump()

    # --- Layer 2: Structural Extraction ---
    primary_graph = execute_layer2(primary_image_path, primary_class.plan_type)
    intermediate_data["layer2"]["primary"] = primary_graph.model_dump()

    secondary_graph = None
    if secondary_image_path and secondary_class:
        secondary_graph = execute_layer2(secondary_image_path, secondary_class.plan_type)
        intermediate_data["layer2"]["secondary"] = secondary_graph.model_dump()

    # --- Layer 3: Domain Rule Verification ---
    rule_violations = execute_layer3(primary_graph)
    if secondary_graph:
        sec_violations = execute_layer3(secondary_graph)
        rule_violations.extend(sec_violations)
    intermediate_data["layer3"]["violations"] = [v.model_dump() for v in rule_violations]

    # --- Layer 4: AI Reasoning / Adversarial Pass ---
    reasoning_findings = execute_layer4(
        graph=primary_graph,
        violations=rule_violations,
        mode=mode,
        second_graph=secondary_graph,
    )
    intermediate_data["layer4"]["findings"] = [rf.model_dump() for rf in reasoning_findings]

    # --- Layer 5: Cross-Verification & Consolidation ---
    final_report = execute_layer5(
        session_id=session_id,
        plan_types=plan_types,
        graph=primary_graph,
        rule_violations=rule_violations,
        reasoning_findings=reasoning_findings,
        second_graph=secondary_graph,
    )
    intermediate_data["layer5"]["report"] = final_report.model_dump()

    # Store for intermediate queries
    SESSION_STORE[session_id] = intermediate_data

    return final_report


def get_session_layer_data(session_id: str, layer_num: int) -> Optional[Dict[str, Any]]:
    session = SESSION_STORE.get(session_id)
    if not session:
        return None
    layer_key = f"layer{layer_num}"
    return session.get(layer_key)
