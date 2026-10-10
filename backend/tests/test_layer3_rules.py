"""
Test suite for BluePrint Sentinel Layer 3 rules.
Zero models are loaded during these tests.
Tests all architectural egress, electrical redundancy, and cyber-physical security rules.
"""
from backend.schemas.models import StructuralGraph, GraphElement
from backend.rules.rule_definitions import (
    rule_egress_01,
    rule_egress_02,
    rule_egress_03,
    rule_egress_04,
    rule_elec_01,
    rule_elec_02,
    rule_elec_03,
    rule_elec_04,
    rule_net_01,
    rule_net_02,
)
from backend.pipeline.layer3_rules import execute_layer3


def test_egress_01_passing():
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


def test_egress_03_dead_end_failing():
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="dead_end_pocket", kind="room", label="Dead End Archive", attributes={"occupancy": 40}),
            GraphElement(id="hall_1", kind="room", label="Hallway"),
            GraphElement(id="exit_1", kind="exit"),
        ],
        adjacency=[
            ("dead_end_pocket", "hall_1"),
            ("hall_1", "exit_1"),
        ],
    )
    violations = rule_egress_03(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "EGRESS-03"


def test_egress_04_door_capacity_failing():
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="hall_large", kind="room", attributes={"occupancy": 300}),
            GraphElement(id="exit_narrow", kind="exit", attributes={"clear_width_inches": 32.0}),
        ],
        adjacency=[("hall_large", "exit_narrow")],
    )
    violations = rule_egress_04(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "EGRESS-04"


def test_elec_01_passing():
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="grid_primary", kind="node", attributes={"source_type": "primary"}),
            GraphElement(id="gen_backup", kind="node", attributes={"source_type": "backup"}),
            GraphElement(id="panel_normal", kind="panel"),
            GraphElement(id="panel_emergency", kind="panel"),
            GraphElement(id="critical_load", kind="node", attributes={"is_critical": True}),
        ],
        adjacency=[
            ("grid_primary", "panel_normal"),
            ("gen_backup", "panel_emergency"),
            ("panel_emergency", "critical_load"),
        ],
    )
    violations = rule_elec_01(graph)
    assert len(violations) == 0


def test_elec_01_failing_shared_panel():
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="grid_primary", kind="node", attributes={"source_type": "primary"}),
            GraphElement(id="gen_backup", kind="node", attributes={"source_type": "backup"}),
            GraphElement(id="panel_shared", kind="panel"),
            GraphElement(id="critical_server", kind="node", attributes={"is_critical": True}),
        ],
        adjacency=[
            ("grid_primary", "panel_shared"),
            ("gen_backup", "panel_shared"),
            ("panel_shared", "critical_server"),
        ],
    )
    violations = rule_elec_01(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-01"
    assert violations[0].severity == "critical"


def test_elec_02_overload():
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="panel_overloaded", kind="panel", attributes={"rated_load": 100.0, "current_load": 125.0}),
            GraphElement(id="panel_normal", kind="panel", attributes={"rated_load": 200.0, "current_load": 150.0}),
        ],
        adjacency=[],
    )
    violations = rule_elec_02(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-02"
    assert "panel_overloaded" in violations[0].element_ids


def test_elec_03_unprotected_critical():
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="grid_only", kind="node", attributes={"source_type": "primary"}),
            GraphElement(id="panel_1", kind="panel"),
            GraphElement(id="critical_hvac", kind="node", attributes={"is_critical": True}),
        ],
        adjacency=[
            ("grid_only", "panel_1"),
            ("panel_1", "critical_hvac"),
        ],
    )
    violations = rule_elec_03(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-03"


def test_elec_04_cascaded_oversubscription():
    graph = StructuralGraph(
        plan_type="electrical_diagram",
        elements=[
            GraphElement(id="main_feeder", kind="panel", attributes={"rated_load": 100.0}),
            GraphElement(id="sub_panel_1", kind="panel", attributes={"rated_load": 70.0}),
            GraphElement(id="sub_panel_2", kind="panel", attributes={"rated_load": 70.0}),
        ],
        adjacency=[
            ("main_feeder", "sub_panel_1"),
            ("main_feeder", "sub_panel_2"),
        ],
    )
    violations = rule_elec_04(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "ELEC-04"


def test_net_01_spof():
    graph = StructuralGraph(
        plan_type="network_diagram",
        elements=[
            GraphElement(id="scada_master", kind="node", attributes={"is_critical": True}),
            GraphElement(id="switch_single", kind="node", label="Single Switch"),
            GraphElement(id="rtu_field", kind="node", attributes={"is_critical": True}),
        ],
        adjacency=[
            ("scada_master", "switch_single"),
            ("switch_single", "rtu_field"),
        ],
    )
    violations = rule_net_01(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "NET-01"
    assert "switch_single" in violations[0].element_ids


def test_net_02_scada_unsegmented():
    graph = StructuralGraph(
        plan_type="network_diagram",
        elements=[
            GraphElement(id="scada_plc", kind="node", attributes={"is_ot_device": True}),
            GraphElement(id="office_switch", kind="node"),
        ],
        adjacency=[("scada_plc", "office_switch")],
    )
    violations = rule_net_02(graph)
    assert len(violations) == 1
    assert violations[0].rule_id == "NET-02"


def test_orchestration_all_rules():
    graph = StructuralGraph(
        plan_type="floor_plan",
        elements=[
            GraphElement(id="room_1", kind="room"),
            GraphElement(id="exit_1", kind="exit"),
        ],
        adjacency=[("room_1", "exit_1")],
    )
    violations = execute_layer3(graph)
    assert isinstance(violations, list)
