"""
Test suite for BluePrint Sentinel Layer 3 rules.
Zero models are loaded during these tests.
"""

from backend.schemas.models import StructuralGraph, GraphElement
from backend.rules.rule_definitions import (
    rule_egress_01,
    rule_egress_02,
    rule_elec_01,
    rule_elec_02,
    rule_net_01,
)
from backend.pipeline.layer3_rules import execute_layer3


def test_egress_01_passing():
    # Room -> Door -> Exit (0 intermediate rooms)
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="room_1", kind="room", label="Office 1"),
            GraphElement(id="door_1", kind="door"),
            GraphElement(id="exit_1", kind="exit", label="Main Exit"),
        ],
        adjacency=[
            ("room_1", "door_1"),
            ("door_1", "exit_1"),
        ],
    )
    violations = rule_egress_01(graph)
    assert len(violations) == 0


def test_egress_01_failing_isolated_room():
    # Room has no connection to exit
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="room_isolated", kind="room", label="Storage Vault"),
            GraphElement(id="exit_1", kind="exit", label="Main Exit"),
        ],
        adjacency=[],
    )
    violations = rule_egress_01(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "EGRESS-01"
    assert violations[0].severity == "critical"
    assert "room_isolated" in violations[0].element_ids


def test_egress_01_failing_too_many_intermediate_rooms():
    # Room A -> Room B -> Room C -> Room D -> Exit (3 intermediate rooms > max 2)
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="room_a", kind="room", label="Deep Server Room"),
            GraphElement(id="room_b", kind="room", label="Lab"),
            GraphElement(id="room_c", kind="room", label="Hallway"),
            GraphElement(id="room_d", kind="room", label="Lobby"),
            GraphElement(id="exit_1", kind="exit", label="North Exit"),
        ],
        adjacency=[
            ("room_a", "room_b"),
            ("room_b", "room_c"),
            ("room_c", "room_d"),
            ("room_d", "exit_1"),
        ],
    )
    violations = rule_egress_01(graph)
    assert len(violations) >= 1
    deep_room_violations = [v for v in violations if "room_a" in v.element_ids]
    assert len(deep_room_violations) == 1
    assert deep_room_violations[0].severity == "high"


def test_egress_02_passing():
    # High occupancy with 2 exits
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="auditorium", kind="room", attributes={"occupancy": 120}),
            GraphElement(id="exit_west", kind="exit"),
            GraphElement(id="exit_east", kind="exit"),
        ],
        adjacency=[],
    )
    violations = rule_egress_02(graph)
    assert len(violations) == 0


def test_egress_02_failing():
    # High occupancy (>50) with only 1 exit
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="auditorium", kind="room", attributes={"occupancy": 150}),
            GraphElement(id="exit_main", kind="exit"),
        ],
        adjacency=[],
    )
    violations = rule_egress_02(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "EGRESS-02"
    assert violations[0].severity == "critical"


def test_elec_01_passing():
    # Critical load powered by isolated backup panel and separate primary panel
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="icu_ventilators", kind="node", attributes={"is_critical": True}),
            GraphElement(id="panel_ats", kind="panel", label="ATS Transfer Panel"),
            GraphElement(id="gen_backup", kind="node", attributes={"source_type": "backup"}),
        ],
        adjacency=[
            ("icu_ventilators", "panel_ats"),
            ("panel_ats", "gen_backup"),
        ],
    )
    violations = rule_elec_01(graph)
    assert len(violations) == 0


def test_elec_01_failing_shared_panel():
    # Critical load powered by panel connected simultaneously to primary grid and backup generator
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="critical_datacenter", kind="node", attributes={"is_critical": True}),
            GraphElement(id="panel_main", kind="panel", label="Main Distribution Panel 1"),
            GraphElement(id="grid_primary", kind="node", attributes={"source_type": "primary"}),
            GraphElement(id="gen_backup", kind="node", attributes={"source_type": "backup"}),
        ],
        adjacency=[
            ("critical_datacenter", "panel_main"),
            ("panel_main", "grid_primary"),
            ("panel_main", "gen_backup"),
        ],
    )
    violations = rule_elec_01(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-01"
    assert "critical_datacenter" in violations[0].element_ids


def test_elec_02_overload():
    # Circuit exceeding rated load
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(
                id="panel_sub_1",
                kind="panel",
                attributes={"rated_load": 100, "current_load": 145},
            ),
        ],
        adjacency=[],
    )
    violations = rule_elec_02(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-02"
    assert "145" in violations[0].rationale


def test_net_01_spof():
    # Router 1 is the sole intermediary between Critical Node A and Critical Node B
    graph = StructuralGraph(
        plan_type="network_diagram",
        elements=[
            GraphElement(id="scada_controller", kind="node", attributes={"is_critical": True}),
            GraphElement(id="router_spof", kind="node", label="Core Switch"),
            GraphElement(id="hmi_station", kind="node", attributes={"is_critical": True}),
        ],
        adjacency=[
            ("scada_controller", "router_spof"),
            ("router_spof", "hmi_station"),
        ],
    )
    violations = rule_net_01(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "NET-01"
    assert "router_spof" in violations[0].element_ids


def test_layer3_orchestration():
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="trapped_room", kind="room", label="Isolated Server Room"),
        ],
        adjacency=[],
    )
    violations = execute_layer3(graph)
    assert len(violations) >= 1
    assert any(v.rule_id == "EGRESS-01" for v in violations)
