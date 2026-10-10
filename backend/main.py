"""
FastAPI Application Entrypoint for BluePrint Sentinel.
Local-only inference serving, blueprint inspection APIs, and formal audit export endpoints.
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, Literal
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.schemas.models import FinalReport
from backend.pipeline.orchestrator import run_pipeline, get_session_layer_data, get_session_report
from backend.pipeline.model_manager import ModelManager

app = FastAPI(
    title="BluePrint Sentinel API",
    description="Local Autonomous AI for Critical Infrastructure Audit",
    version="1.2.0",
)

# CORS config to allow local React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
SAMPLES_DIR = BASE_DIR / "data" / "samples"
UPLOADS_DIR = BASE_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

# Mount static file handlers
app.mount("/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
def health_check():
    """
    Returns system health and proves that all models are locally mapped on disk.
    """
    manager = ModelManager.get_instance()
    return manager.get_health_status()


@app.post("/analyze", response_model=FinalReport)
async def analyze_plans(
    file_primary: UploadFile = File(..., description="Primary Plan (e.g. Architectural Floor Plan)"),
    file_secondary: Optional[UploadFile] = File(None, description="Optional Secondary Plan (e.g. Electrical Diagram)"),
    mode: Literal["inspector", "adversarial"] = Form("inspector"),
):
    """
    Ingests 1 or 2 blueprints/schematics, runs the 5-layer pipeline, and produces a final verified report.
    """
    session_uid = str(uuid.uuid4())[:8]
    try:
        primary_ext = Path(file_primary.filename or "plan.png").suffix or ".png"
        primary_filename = f"{session_uid}_primary{primary_ext}"
        primary_path = str(UPLOADS_DIR / primary_filename)
        with open(primary_path, "wb") as f:
            shutil.copyfileobj(file_primary.file, f)

        secondary_path = None
        secondary_filename = None
        if file_secondary and file_secondary.filename:
            secondary_ext = Path(file_secondary.filename).suffix or ".png"
            secondary_filename = f"{session_uid}_secondary{secondary_ext}"
            secondary_path = str(UPLOADS_DIR / secondary_filename)
            with open(secondary_path, "wb") as f:
                shutil.copyfileobj(file_secondary.file, f)

        primary_url = f"http://localhost:8000/uploads/{primary_filename}"
        secondary_url = f"http://localhost:8000/uploads/{secondary_filename}" if secondary_filename else None

        report = run_pipeline(
            primary_image_path=primary_path,
            secondary_image_path=secondary_path,
            mode=mode,
            primary_image_url=primary_url,
            secondary_image_url=secondary_url,
        )
        return report

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution error: {str(e)}")


@app.get("/analyze/{session_id}/layer/{layer_num}")
def get_layer_trace(session_id: str, layer_num: int):
    """
    Returns the raw intermediate JSON contract for the requested layer (1-5)
    to power the 'Show Your Work' transparency panel.
    """
    if layer_num < 1 or layer_num > 5:
        raise HTTPException(status_code=400, detail="Layer number must be between 1 and 5.")
    
    data = get_session_layer_data(session_id, layer_num)
    if data is None:
        raise HTTPException(status_code=404, detail="Session ID or layer data not found.")
    return data


@app.get("/export/{session_id}/json")
def export_report_json(session_id: str):
    """
    Exports full machine-readable JSON for integration into SIEM / CMDB systems.
    """
    report = get_session_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Session report not found.")
    return report


@app.get("/export/{session_id}/markdown")
def export_report_markdown(session_id: str):
    """
    Exports a formal executive audit report in GitHub-flavored Markdown.
    """
    report = get_session_report(session_id)
    if not report:
        raise HTTPException(status_code=404, detail="Session report not found.")

    metrics = report.get("resilience_metrics", {})
    findings = report.get("findings", [])

    lines = [
        f"# BluePrint Sentinel — Critical Infrastructure Audit Report",
        f"**Session ID:** `{report.get('session_id')}`",
        f"**Plan Typologies Audited:** {', '.join(report.get('plan_types', []))}",
        f"**Execution Mode:** Fully Offline Air-Gapped Local Inference",
        f"",
        f"---",
        f"",
        f"## Executive Summary & Resilience Grade",
        f"- **Overall Resilience Score:** {metrics.get('overall_score', 'N/A')} / 100",
        f"- **Safety & Compliance Grade:** **Grade {metrics.get('grade', 'B')}**",
        f"- **Architectural Life Safety:** {metrics.get('discipline_scores', {}).get('architectural', 'N/A')}%",
        f"- **Electrical Redundancy:** {metrics.get('discipline_scores', {}).get('electrical', 'N/A')}%",
        f"- **Cyber-Physical Isolation:** {metrics.get('discipline_scores', {}).get('cyber_physical', 'N/A')}%",
        f"",
        f"> {metrics.get('executive_summary', 'No summary generated.')}",
        f"",
        f"---",
        f"",
        f"## Itemized Audit Findings ({len(findings)} Total)",
        f"",
    ]

    for i, f in enumerate(findings, start=1):
        lines.extend([
            f"### {i}. [{f.get('severity', '').upper()}] {f.get('title')}",
            f"- **Confidence:** {int(f.get('confidence', 0) * 100)}% | **Contributing Layers:** {', '.join(f.get('contributing_layers', []))}",
            f"- **Regulatory Standard:** `{f.get('regulatory_code')}`",
            f"- **Grounded Assets:** {', '.join(f.get('element_ids', []))}",
            f"- **Explanation:** {f.get('explanation')}",
            f"- **Recommended Remediation:** *{f.get('remediation')}*",
            f"",
        ])

    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=Blueprint_Sentinel_Audit_{session_id[:8]}.md"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
