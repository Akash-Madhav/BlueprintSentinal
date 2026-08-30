"""
Integration tests for BluePrint Sentinel Orchestrator and Full Pipeline.
"""
from pathlib import Path
from backend.pipeline.orchestrator import run_pipeline, get_session_layer_data
from backend.schemas.models import FinalReport
from scripts.generate_sample_data import create_sample_floor_plan, create_sample_electrical_diagram

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SAMPLES_DIR = BASE_DIR / "data" / "samples"


def test_full_pipeline_single_plan():
    create_sample_floor_plan()
    floor_sample = SAMPLES_DIR / "demo_floor_plan_office.png"

    report: FinalReport = run_pipeline(
        primary_image_path=str(floor_sample),
        mode="inspector",
    )

    assert report.session_id is not None
    assert "floor_plan" in report.plan_types
    assert isinstance(report.findings, list)

    # Test "Show Your Work" intermediate inspectability
    layer1_data = get_session_layer_data(report.session_id, 1)
    layer3_data = get_session_layer_data(report.session_id, 3)
    assert layer1_data is not None
    assert layer3_data is not None


def test_full_pipeline_cross_reference_mode():
    create_sample_floor_plan()
    create_sample_electrical_diagram()
    floor_sample = SAMPLES_DIR / "demo_floor_plan_office.png"
    elec_sample = SAMPLES_DIR / "demo_electrical_diagram.png"

    report: FinalReport = run_pipeline(
        primary_image_path=str(floor_sample),
        secondary_image_path=str(elec_sample),
        mode="adversarial",
    )

    assert len(report.plan_types) == 2
    assert any("ELEC" in f.finding_id or "CROSS" in f.finding_id or "EGRESS" in f.finding_id for f in report.findings)
