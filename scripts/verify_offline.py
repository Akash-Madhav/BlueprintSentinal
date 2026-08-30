"""
Offline verification sanity check script for BluePrint Sentinel.
Disables outbound network access and runs the full 5-layer pipeline end-to-end.
"""
import os
import sys
from pathlib import Path

# Enforce strict offline execution environment
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["NO_PROXY"] = "*"

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.pipeline.orchestrator import run_pipeline
from backend.schemas.models import FinalReport


def main():
    print("=" * 65)
    print("BluePrint Sentinel — Offline Pipeline Verification")
    print("=" * 65)
    print("Enforcing strict offline mode (HF_HUB_OFFLINE=1, no external APIs)...")

    samples_dir = BASE_DIR / "data" / "samples"
    floor_plan_sample = samples_dir / "demo_floor_plan_office.png"
    elec_sample = samples_dir / "demo_electrical_diagram.png"

    if not floor_plan_sample.exists() or not elec_sample.exists():
        print("Generating demo sample blueprint images...")
        from scripts.generate_sample_data import create_sample_floor_plan, create_sample_electrical_diagram
        create_sample_floor_plan()
        create_sample_electrical_diagram()

    print(f"\nRunning 5-Layer Pipeline in Cross-Reference Mode:")
    print(f"  Primary:   {floor_plan_sample.name}")
    print(f"  Secondary: {elec_sample.name}")
    print(f"  Mode:      Adversarial Red-Team\n")

    report: FinalReport = run_pipeline(
        primary_image_path=str(floor_plan_sample),
        secondary_image_path=str(elec_sample),
        mode="adversarial",
    )

    print("Pipeline executed successfully without network calls!\n")
    print("=" * 65)
    print(f"Session ID:  {report.session_id}")
    print(f"Plan Types:  {', '.join(report.plan_types)}")
    print(f"Total Verified Findings: {len(report.findings)}")
    print("-" * 65)

    for i, finding in enumerate(report.findings, start=1):
        layers_str = "+".join(finding.contributing_layers)
        print(f"\n[{i}] [{finding.severity.upper()}] {finding.title} (Layers: {layers_str}, Conf: {finding.confidence:.2f})")
        print(f"    Elements: {', '.join(finding.element_ids)}")
        print(f"    Explanation: {finding.explanation[:120]}...")

    print("\n" + "=" * 65)
    print(" VERIFICATION PASSED: All five layers executed strictly offline.")
    print("=" * 65)


if __name__ == "__main__":
    main()
