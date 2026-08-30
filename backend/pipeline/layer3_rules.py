"""
Layer 3: Domain Rule Verification (Deterministic, pure Python, zero model dependencies)
"""
import logging
from typing import List
from backend.schemas.models import StructuralGraph, RuleViolation
from backend.rules.rule_definitions import RULES_REGISTRY

logger = logging.getLogger(__name__)


def execute_layer3(graph: StructuralGraph) -> List[RuleViolation]:
    """
    Executes all domain rules associated with the plan type of the provided structural graph.
    Returns a list of RuleViolation objects.
    """
    violations: List[RuleViolation] = []
    rules = RULES_REGISTRY.get(graph.plan_type, [])
    
    # Also evaluate generic rules if any
    if not rules and graph.plan_type != "unknown":
        # Fallback to check if rules exist for partial match
        for ptype, p_rules in RULES_REGISTRY.items():
            if ptype in graph.plan_type:
                rules = p_rules
                break

    for rule_fn in rules:
        try:
            results = rule_fn(graph)
            violations.extend(results)
        except Exception as e:
            logger.error(f"Error executing rule {rule_fn.__name__}: {e}", exc_info=True)

    return violations
