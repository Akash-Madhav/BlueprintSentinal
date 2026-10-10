"""
Rule definitions for BluePrint Sentinel Layer 3.
Zero model dependency - deterministic, graph-based verification.
Covers Architectural Egress, Electrical Redundancy, Network Cyber-Physical Reliability,
and Cross-Discipline Infrastructure Hazards.
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
    Citation: NFPA 101 Life Safety Code §7.5 / IBC §1016.
    """
    violations: List[RuleViolation] = []
    
    exit_ids = {e.id for e in graph.elements if e.kind == "exit" or e.attributes.get("is_exit") is True}
    rooms = [e for e in graph.elements if e.kind == "room"]
    
    if not rooms:
        return violations

    adj: Dict[str, List[str]] = {elem.id: [] for elem in graph.elements}
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
                    rationale=f"Room '{room.label or room.id}' has no navigable exit path to an exterior evacuation route.",
                    regulatory_code="NFPA 101 §7.5.1 / IBC §1006.2",
                    remediation="Install a dedicated egress doorway connecting to a primary circulation corridor or exterior exit.",
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
                    regulatory_code="IBC §1016.2 / NFPA 101 §7.5.2",
                    remediation=f"Reconfigure corridor access so occupants do not traverse more than {MAX_EGRESS_INTERMEDIATE_ROOMS} intervening intervening rooms.",
                )
            )

    return violations


def rule_egress_02(graph: StructuralGraph) -> List[RuleViolation]:
    """
    EGRESS-02: A floor/space with occupancy above threshold must have >= 2 independent exits.
    Citation: NFPA 101 §7.4.1 / IBC §1006.2.1.
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
                regulatory_code="IBC §1006.2.1 / NFPA 101 §7.4.1",
                remediation=f"Add at least {MIN_EXITS_FOR_HIGH_OCCUPANCY - len(exit_elements)} independent, remotely located exterior fire exit(s).",
            )
        )
        
    return violations


def rule_egress_03(graph: StructuralGraph) -> List[RuleViolation]:
    """
    EGRESS-03: Dead-End Corridor & Entrapment Zone Detection.
    Detects corridors or rooms that terminate in a dead end with only one access path,
    exceeding allowed egress limits or where dead-end depth is high.
    Citation: IBC §1020.4 / NFPA 101 §7.5.1.5.
    """
    violations: List[RuleViolation] = []
    exit_ids = {e.id for e in graph.elements if e.kind == "exit" or e.attributes.get("is_exit") is True}
    rooms_and_corridors = [e for e in graph.elements if e.kind in ["room", "corridor", "hallway"]]
    
    if not exit_ids:
        return violations

    adj: Dict[str, List[str]] = {elem.id: [] for elem in graph.elements}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)

    for item in rooms_and_corridors:
        if item.id in exit_ids:
            continue
        neighbors = adj.get(item.id, [])
        # Dead-end check: degree 1 room with occupancy > 25, or marked dead_end
        is_dead_end = item.attributes.get("is_dead_end") is True
        occupancy = int(item.attributes.get("occupancy", 0) or 0)
        
        if (len(neighbors) == 1 and occupancy > 25) or is_dead_end:
            violations.append(
                RuleViolation(
                    rule_id="EGRESS-03",
                    severity="high",
                    element_ids=[item.id],
                    rationale=(
                        f"Dead-End Entrapment Hazard: Space '{item.label or item.id}' (occupancy: {occupancy}) "
                        f"has only a single egress access path. Any obstruction in connecting node "
                        f"'{neighbors[0] if neighbors else 'corridor'}' creates complete occupant entrapment."
                    ),
                    regulatory_code="IBC §1020.4 / NFPA 101 §7.5.1.5",
                    remediation="Provide a secondary independent egress door or continuous loop circulation corridor.",
                )
            )

    return violations


def rule_egress_04(graph: StructuralGraph) -> List[RuleViolation]:
    """
    EGRESS-04: Exit Door Width Capacity & Evacuation Bottleneck.
    Ensures exit width meets minimum 0.2 inches (or 5mm) per occupant capacity.
    Citation: IBC §1005.3.1 / NFPA 101 §7.3.3.
    """
    violations: List[RuleViolation] = []
    exits = [e for e in graph.elements if e.kind == "exit"]
    
    total_occupancy = sum(
        int(e.attributes.get("occupancy", 0)) 
        for e in graph.elements if "occupancy" in e.attributes
    )
    
    for exit_elem in exits:
        width_inches = float(exit_elem.attributes.get("clear_width_inches", 36))
        # Minimum required width based on share of occupants
        allocated_occupancy = total_occupancy / max(1, len(exits))
        min_required_width = allocated_occupancy * 0.2
        
        if width_inches < min_required_width and allocated_occupancy > 150:
            violations.append(
                RuleViolation(
                    rule_id="EGRESS-04",
                    severity="high",
                    element_ids=[exit_elem.id],
                    rationale=(
                        f"Exit Doorway Capacity Bottleneck: Exit '{exit_elem.label or exit_elem.id}' has clear width "
                        f"{width_inches} in, which is insufficient for {int(allocated_occupancy)} occupant load "
                        f"(minimum required clear width: {min_required_width:.1f} in)."
                    ),
                    regulatory_code="IBC §1005.3.1 / NFPA 101 §7.3.3",
                    remediation=f"Widen exit portal or install double leaf panic-hardware exit doors to provide >= {min_required_width:.1f} in.",
                )
            )

    return violations


def rule_elec_01(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-01: A backup power source must not share a panel/circuit with the primary source
    for any load tagged 'critical'.
    Citation: NEC 700.10(B) / NFPA 110 §6.2.
    """
    violations: List[RuleViolation] = []
    
    critical_loads = [
        e for e in graph.elements
        if e.attributes.get("is_critical") is True or e.attributes.get("criticality") == "critical"
    ]
    
    adj: Dict[str, List[str]] = {}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)
        
    for load in critical_loads:
        connected = adj.get(load.id, [])
        panels = [e for e in graph.elements if e.id in connected and (e.kind == "panel" or "panel" in e.id.lower())]
        
        for panel in panels:
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
                            f"where primary and backup sources share the same circuit without isolated transfer switch separation."
                        ),
                        regulatory_code="NEC 700.10(B) / NFPA 110 §6.2",
                        remediation="Install an Automatic Transfer Switch (ATS) to mechanically and electrically isolate emergency and normal utility feeds.",
                    )
                )
                
    return violations


def rule_elec_02(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-02: No single circuit may exceed its rated load.
    Citation: NEC 220 / NFPA 70 §408.36.
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
                            f"connected load {current} kW / A exceeds rated load {rated} kW / A ({(current/rated)*100:.1f}% load)."
                        ),
                        regulatory_code="NEC 220 Branch Calculations / NFPA 70 §408",
                        remediation="Rebalance sub-circuits or upgrade breaker/busbar ampacity to prevent nuisance thermal tripping.",
                    )
                )
        except (ValueError, TypeError):
            continue
            
    return violations


def rule_elec_03(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-03: Unprotected Mission-Critical Load without Standby Backup.
    Detects critical infrastructure assets (servers, fire pumps, life safety)
    that lack any connection to a standby or emergency generator.
    Citation: IEEE 446 §4.2 / Uptime Institute Tier III Standards.
    """
    violations: List[RuleViolation] = []
    critical_loads = [
        e for e in graph.elements 
        if e.attributes.get("is_critical") is True or e.attributes.get("criticality") == "critical"
    ]
    
    adj: Dict[str, List[str]] = {}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)
        
    backup_sources = [
        e.id for e in graph.elements 
        if e.attributes.get("source_type") in ["backup", "generator", "ups"]
        or "gen" in e.id.lower() or "backup" in e.id.lower() or "ups" in e.id.lower()
    ]
    
    for load in critical_loads:
        # Check path from load to any backup source
        visited = set()
        queue = deque([load.id])
        visited.add(load.id)
        has_backup = False
        
        while queue:
            curr = queue.popleft()
            if curr in backup_sources:
                has_backup = True
                break
            for nxt in adj.get(curr, []):
                if nxt not in visited:
                    visited.add(nxt)
                    queue.append(nxt)
                    
        if not has_backup:
            violations.append(
                RuleViolation(
                    rule_id="ELEC-03",
                    severity="critical",
                    element_ids=[load.id],
                    rationale=(
                        f"Unprotected Critical Facility Load: Asset '{load.label or load.id}' is designated mission-critical "
                        f"but has NO emergency generator or secondary UPS feed. Utility grid failure will cause immediate blackout."
                    ),
                    regulatory_code="IEEE 446 §4.2 / Uptime Institute Tier III Standard",
                    remediation="Add redundant dual-feed circuitry routed through an uninterrupted power supply (UPS) and standby generator.",
                )
            )

    return violations


def rule_elec_04(graph: StructuralGraph) -> List[RuleViolation]:
    """
    ELEC-04: Cascaded Feeder Over-Subscription.
    Detects downstream panel sum loads exceeding upstream feeder cable/breaker limit.
    Citation: NEC 240 Overcurrent Protection.
    """
    violations: List[RuleViolation] = []
    panels = [e for e in graph.elements if e.kind == "panel"]
    
    adj: Dict[str, List[str]] = {}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        
    for panel in panels:
        upstream_rating = float(panel.attributes.get("rated_load", 0) or 0)
        if upstream_rating <= 0:
            continue
            
        downstream = adj.get(panel.id, [])
        total_downstream_load = 0.0
        for ds_id in downstream:
            ds_elem = next((e for e in graph.elements if e.id == ds_id), None)
            if ds_elem and "rated_load" in ds_elem.attributes:
                total_downstream_load += float(ds_elem.attributes.get("rated_load", 0) or 0)
                
        if total_downstream_load > upstream_rating * 1.25:
            violations.append(
                RuleViolation(
                    rule_id="ELEC-04",
                    severity="high",
                    element_ids=[panel.id],
                    rationale=(
                        f"Cascaded Feeder Over-Subscription: Main panel '{panel.label or panel.id}' (rated {upstream_rating}A/kW) "
                        f"feeds downstream sub-panels totalling {total_downstream_load}A/kW, exceeding safety factor limit (125%)."
                    ),
                    regulatory_code="NEC 240 / IEEE 141",
                    remediation="Subdivide feeder loops or install current-limiting branch breakers.",
                )
            )

    return violations


def rule_net_01(graph: StructuralGraph) -> List[RuleViolation]:
    """
    NET-01: No single network node may be the only path between two 'critical' nodes (Single Point of Failure).
    Citation: NIST SP 800-82r3 / IEC 62443 Industrial Cybersecurity.
    """
    violations: List[RuleViolation] = []
    
    critical_nodes = [
        e.id for e in graph.elements 
        if e.attributes.get("is_critical") is True or e.attributes.get("criticality") == "critical"
    ]
    
    if len(critical_nodes) < 2:
        return violations
        
    adj: Dict[str, set] = {elem.id: set() for elem in graph.elements}
    for u, v in graph.adjacency:
        adj.setdefault(u, set()).add(v)
        adj.setdefault(v, set()).add(u)
        
    all_node_ids = [e.id for e in graph.elements if e.kind in ["node", "panel", "room", "router", "switch"]]
    
    for i in range(len(critical_nodes)):
        for j in range(i + 1, len(critical_nodes)):
            src = critical_nodes[i]
            dst = critical_nodes[j]
            
            def is_reachable(exclude_node: str | None = None) -> bool:
                visited = set()
                queue = deque([src])
                visited.add(src)
                while queue:
                    curr = queue.popleft()
                    if curr == dst:
                        return True
                    for nxt in adj.get(curr, set()):
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
                                f"Single Point of Failure (SPOF): Node '{inter_elem.label if inter_elem else intermediate}' "
                                f"is the only communication route between critical assets '{src}' and '{dst}'."
                            ),
                            regulatory_code="NIST SP 800-82 / IEC 62443-3-3",
                            remediation="Implement redundant mesh routing or a secondary ring topology link.",
                        )
                    )
                    break
                    
    return violations


def rule_net_02(graph: StructuralGraph) -> List[RuleViolation]:
    """
    NET-02: SCADA / OT Unsegmented Broadcast Domain.
    Detects operational technology / SCADA controllers residing on the same unsegmented
    subnet as corporate/guest endpoints without a perimeter firewall/DMZ barrier.
    Citation: ISA/IEC 62443-3-2 Security Zones and Conduits.
    """
    violations: List[RuleViolation] = []
    
    scada_nodes = [
        e for e in graph.elements 
        if "scada" in e.id.lower() or "rtu" in e.id.lower() or e.attributes.get("is_ot_device") is True
    ]
    
    adj: Dict[str, List[str]] = {}
    for u, v in graph.adjacency:
        adj.setdefault(u, []).append(v)
        adj.setdefault(v, []).append(u)
        
    for scada in scada_nodes:
        # Check if connected through a switch directly to public/office node without firewall
        for nbr in adj.get(scada.id, []):
            nbr_elem = next((e for e in graph.elements if e.id == nbr), None)
            if nbr_elem and ("switch" in nbr_elem.id.lower() or "hub" in nbr_elem.id.lower()):
                has_firewall = any("firewall" in n.lower() or "dmz" in n.lower() for n in adj.get(nbr_elem.id, []))
                if not has_firewall:
                    violations.append(
                        RuleViolation(
                            rule_id="NET-02",
                            severity="critical",
                            element_ids=[scada.id, nbr_elem.id],
                            rationale=(
                                f"OT/SCADA Perimeter Exposure: Industrial controller '{scada.label or scada.id}' is directly "
                                f"attached to broadcast switch '{nbr_elem.label or nbr_elem.id}' with no firewall or DMZ conduit boundary."
                            ),
                            regulatory_code="ISA/IEC 62443-3-2 Zones & Conduits / NERC CIP-005",
                            remediation="Deploy an industrial firewall (IEC 62443 Zone Boundary) to isolate OT traffic from IT LAN.",
                        )
                    )
                    break

    return violations


RULES_REGISTRY: Dict[str, List[Callable[[StructuralGraph], List[RuleViolation]]]] = {
    "floor_plan": [rule_egress_01, rule_egress_02, rule_egress_03, rule_egress_04],
    "electrical_diagram": [rule_elec_01, rule_elec_02, rule_elec_03, rule_elec_04],
    "network_diagram": [rule_net_01, rule_net_02],
}
