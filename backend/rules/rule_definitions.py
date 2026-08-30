"""
Rule definitions for BluePrint Sentinel Layer 3.
Zero model dependency - deterministic, graph-based verification.
"""
from collections import deque
from typing import Callable, Dict, List
from backend.schemas.models import StructuralGraph, RuleViolation
from backend.config import (
    MAX_EGRESS_INTERMEDIATE_ROOMS,
    HIGH_OCCUPANCY_THRESHOLD,
    MIN_EXITS_FOR_HIGH_OCCUPANCY,
)


def rule_egress_01(graph: StructuralGraph) -> List[RuleViolation]:
    """
    EGRESS-01: Every room must have a path to an exit through <= N intermediate rooms.
    Default max intermediate rooms = 2.
    """
    violations: List[RuleViolation] = []
    
    # Identify exit elements and room elements
    exit_ids = {e.id for e in graph.elements if e.kind == "exit" or e.attributes.get("is_exit") is True}
    rooms = [e for e in graph.elements if e.kind == "room"]
    
    if not rooms:
        return violations

    # Build bidirectional adjacency map
    adj: Dict[str, List[str]] = {}
    for elem in graph.elements:
        adj[elem.id] = []
        
    for u, v in graph.adjacency:
        if u not in adj:
            adj[u] = []
        if v not in adj:
            adj[v] = []
        adj[u].append(v)
        adj[v].append(u)

    for room in rooms:
        if room.id in exit_ids:
            continue
            
        # BFS to find shortest path to an exit
        queue = deque([(room.id, 0)])
        visited = {room.id}
        found_exit = False
        shortest_intermediate_rooms = float("inf")

        while queue:
            curr_id, room_count = queue.popleft()

            if curr_id in exit_ids:
                found_exit = True
                shortest_intermediate_rooms = min(shortest_intermediate_rooms, room_count)
                break

            for neighbor in adj.get(curr_id, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    # Check if neighbor is a room
                    neighbor_elem = next((e for e in graph.elements if e.id == neighbor), None)
                    is_room = neighbor_elem and neighbor_elem.kind == "room"
                    next_count = room_count + 1 if is_room else room_count
                    queue.append((neighbor, next_count))

        if not found_exit:
            violations.append(
                RuleViolation(
                    rule_id="EGRESS-01",
                    severity="critical",
                    element_ids=[room.id],
                    rationale=f"Room '{room.label or room.id}' has no navigable exit path.",
                )
            )
        elif shortest_intermediate_rooms > MAX_EGRESS_INTERMEDIATE_ROOMS:
            violations.append(
                RuleViolation(
                    rule_id="EGRESS-01",
                    severity="high",
                    element_ids=[room.id],
                    rationale=(
                        f"Room '{room.label or room.id}' requires traversing {shortest_intermediate_rooms} "
                        f"intermediate rooms to reach an exit (maximum allowed is {MAX_EGRESS_INTERMEDIATE_ROOMS})."
                    ),
                )
            )

    return violations


def rule_egress_02(graph: StructuralGraph) -> List[RuleViolation]:
    """
    EGRESS-02: A floor/space with occupancy above threshold must have >= 2 independent exits.
    """
    violations: List[RuleViolation] = []
    
    total_occupancy = 0
    for e in graph.elements:
        if "occupancy" in e.attributes:
            try:
                total_occupancy += int(e.attributes["occupancy"])
            except (ValueError, TypeError):
                pass
                
    exit_elements = [e for e in graph.elements if e.kind == "exit" or e.attributes.get("is_exit") is True]
    
    if total_occupancy > HIGH_OCCUPANCY_THRESHOLD and len(exit_elements) < MIN_EXITS_FOR_HIGH_OCCUPANCY:
        violations.append(
            RuleViolation(
                rule_id="EGRESS-02",
                severity="critical",
                element_ids=[e.id for e in exit_elements] if exit_elements else ["floor_level"],
                rationale=(
                    f"Total calculated occupancy is {total_occupancy} (exceeds threshold of {HIGH_OCCUPANCY_THRESHOLD}), "
                    f"but only {len(exit_elements)} exit(s) are available (minimum required: {MIN_EXITS_FOR_HIGH_OCCUPANCY})."
                ),
            )
        )
        
    return violations


def rule_elec_01(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-01: A backup power source must not share a panel/circuit with the primary source
    for any load tagged 'critical'.
    """
    violations: List[RuleViolation] = []
    
    # Find critical loads
    critical_loads = [
        e for e in graph.elements
        if e.attributes.get("is_critical") is True or e.attributes.get("criticality") == "critical"
    ]
    
    # Map connections
    adj: Dict[str, List[str]] = {}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)
        
    for load in critical_loads:
        # Trace backwards to panels / sources
        connected = adj.get(load.id, [])
        panels = [e for e in graph.elements if e.id in connected and (e.kind == "panel" or "panel" in e.id.lower())]
        
        for panel in panels:
            # Check if panel is directly or indirectly connected to both primary and backup
            panel_connections = adj.get(panel.id, [])
            sources = [
                e for e in graph.elements 
                if e.id in panel_connections and (
                    e.attributes.get("source_type") in ["primary", "backup", "generator", "utility"]
                    or "gen" in e.id.lower() or "grid" in e.id.lower() or "backup" in e.id.lower()
                )
            ]
            
            source_types = set()
            for s in sources:
                stype = s.attributes.get("source_type")
                if not stype:
                    if "gen" in s.id.lower() or "backup" in s.id.lower():
                        stype = "backup"
                    else:
                        stype = "primary"
                source_types.add(stype)
                
            if "primary" in source_types and "backup" in source_types:
                violations.append(
                    RuleViolation(
                        rule_id="ELEC-01",
                        severity="critical",
                        element_ids=[load.id, panel.id] + [s.id for s in sources],
                        rationale=(
                            f"Critical load '{load.label or load.id}' is powered via panel '{panel.label or panel.id}' "
                            f"where primary and backup sources share the same circuit without isolated transfer isolation."
                        ),
                    )
                )
                
    return violations


def rule_elec_02(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-02: No single circuit may exceed its rated load.
    """
    violations: List[RuleViolation] = []
    
    circuits_or_panels = [
        e for e in graph.elements 
        if e.kind in ["panel", "node"] and "rated_load" in e.attributes
    ]
    
    for item in circuits_or_panels:
        try:
            rated = float(item.attributes.get("rated_load", 0))
            current = float(item.attributes.get("current_load", 0) or item.attributes.get("actual_load", 0))
            if rated > 0 and current > rated:
                violations.append(
                    RuleViolation(
                        rule_id="ELEC-02",
                        severity="high",
                        element_ids=[item.id],
                        rationale=(
                            f"Circuit/Panel '{item.label or item.id}' exceeds capacity: "
                            f"connected load {current} kW / A exceeds rated load {rated} kW / A."
                        ),
                    )
                )
        except (ValueError, TypeError):
            continue
            
    return violations


def rule_net_01(graph: StructuralGraph) -> List[RuleViolation]:
    """
    NET-01: No single network node may be the only path between two 'critical' nodes (Single Point of Failure).
    """
    violations: List[RuleViolation] = []
    
    critical_nodes = [
        e.id for e in graph.elements 
        if e.attributes.get("is_critical") is True or e.attributes.get("criticality") == "critical"
    ]
    
    if len(critical_nodes) < 2:
        return violations
        
    adj: Dict[str, set] = {}
    for elem in graph.elements:
        adj[elem.id] = set()
    for u, v in graph.adjacency:
        adj.setdefault(u, set()).add(v)
        adj.setdefault(v, set()).add(u)
        
    all_node_ids = [e.id for e in graph.elements if e.kind in ["node", "panel", "room"]]
    
    # Test for articulation points (bridges/SPOF) between critical pairs
    for i in range(len(critical_nodes)):
        for j in range(i + 1, len(critical_nodes)):
            src = critical_nodes[i]
            dst = critical_nodes[j]
            
            # Check if reachable originally
            def is_reachable(exclude_node: str | None = None) -> bool:
                visited = set()
                queue = deque([src])
                visited.add(src)
                while queue:
                    curr = queue.popleft()
                    if curr == dst:
                        return True
                    for nxt in adj.get(curr, []):
                        if nxt != exclude_node and nxt not in visited:
                            visited.add(nxt)
                            queue.append(nxt)
                return False

            if not is_reachable():
                continue

            for intermediate in all_node_ids:
                if intermediate == src or intermediate == dst:
                    continue
                if not is_reachable(exclude_node=intermediate):
                    inter_elem = next((e for e in graph.elements if e.id == intermediate), None)
                    violations.append(
                        RuleViolation(
                            rule_id="NET-01",
                            severity="high",
                            element_ids=[intermediate, src, dst],
                            rationale=(
                                f"Single Point of Failure: Node '{inter_elem.label if inter_elem else intermediate}' "
                                f"is the only communication path between critical assets '{src}' and '{dst}'."
                            ),
                        )
                    )
                    break  # report one primary SPOF per critical pair
                    
    return violations


RULES_REGISTRY: Dict[str, List[Callable[[StructuralGraph], List[RuleViolation]]]] = {
    "floor_plan": [rule_egress_01, rule_egress_02],
    "electrical_diagram": [rule_elec_01, rule_elec_02],
    "network_diagram": [rule_net_01],
}
