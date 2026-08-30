"""
FastAPI Application Entrypoint for BluePrint Sentinel.
Local-only inference serving and pipeline inspection APIs.
"""
import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional, Literal
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.schemas.models import FinalReport
from backend.pipeline.orchestrator import run_pipeline, get_session_layer_data
from backend.pipeline.model_manager import ModelManager

app = FastAPI(
    title="BluePrint Sentinel API",
    description="Local Autonomous AI for Critical Infrastructure Audit",
    version="1.0.0",
)

# CORS config to allow local React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    temp_dir = tempfile.mkdtemp(prefix="blueprint_sentinel_")
    try:
        primary_ext = Path(file_primary.filename or "plan.png").suffix or ".png"
        primary_path = os.path.join(temp_dir, f"primary_plan{primary_ext}")
        with open(primary_path, "wb") as f:
            shutil.copyfileobj(file_primary.file, f)

        secondary_path = None
        if file_secondary and file_secondary.filename:
            secondary_ext = Path(file_secondary.filename).suffix or ".png"
            secondary_path = os.path.join(temp_dir, f"secondary_plan{secondary_ext}")
            with open(secondary_path, "wb") as f:
                shutil.copyfileobj(file_secondary.file, f)

        report = run_pipeline(
            primary_image_path=primary_path,
            secondary_image_path=secondary_path,
            mode=mode,
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

