# Implementation prompt — BluePrint Sentinel

Paste everything below into a coding agent (Claude Code, Cursor, etc.) as the task brief. It is self-contained: architecture, folder layout, exact models to fetch, schemas, and acceptance criteria are all specified so the agent doesn't need to guess.

---

## Role and objective

You are building **BluePrint Sentinel**, a fully local, offline-capable AI system that audits infrastructure plans (floor plans and electrical diagrams) for safety, redundancy, and security vulnerabilities using a five-layer verification pipeline. Build a working, demoable, end-to-end system. Do not call any hosted inference API (OpenAI, Anthropic, Google, Replicate, HuggingFace Inference Endpoints, etc.) at runtime. Every model must be downloaded once to a local `models/` directory and loaded from disk.

## Hard constraints (do not violate these)

1. **No runtime network calls for inference.** All classification, vision, OCR, and reasoning must run against locally loaded model weights. It is acceptable to hit the network during a one-time `scripts/download_models.py` setup step; it is not acceptable at any point after that during a pipeline run.
2. **Every model file lives under `models/`, organized by role**, exactly as follows:
   ```
   models/
   ├── llm/
   │   └── gemma-3-4b-it-Q4_K_M.gguf
   ├── vision/
   │   ├── yolov8n-symbols.pt
   │   └── cubicasa5k-seg.onnx
   └── ocr/
       ├── craft_mlt_25k.pth
       └── english_g2.pth
   ```
   If a model cannot be sourced under that exact filename, keep the folder role (`llm/`, `vision/`, `ocr/`) and document the substitution in `models/README.md` — but never point the code at a remote model id at runtime; always resolve to a local path.
3. **Layer 3 (rules) must have zero model dependency.** It is pure Python, unit-testable with no models loaded.
4. **Every finding in the final report must carry a reasoning trace and a reference to the structured-graph element(s) it is about.** No finding may be free text with no grounding.
5. **The system must run on CPU** (GPU optional/accelerating, not required) so it is demoable on a standard laptop with no internet.

## Tech stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2 for schemas.
- **Local LLM serving**: `llama-cpp-python` loading the GGUF file directly (preferred, no separate server process), or Ollama if already configured on the dev machine — but the default path in this repo is `llama-cpp-python` so `pip install -r requirements.txt` is sufficient with no extra service to run.
- **Vision**: `ultralytics` (YOLOv8) for symbol detection, `onnxruntime` for the segmentation model.
- **OCR**: `easyocr` (it manages `craft_mlt_25k.pth` and `english_g2.pth` itself — point its model storage directory at `models/ocr/` via the `model_storage_directory` argument rather than its default cache path).
- **Frontend**: React + Vite, plain fetch calls to the FastAPI backend. Keep it minimal — this is a judged demo, not a production app.
- **Testing**: `pytest` for backend, especially the Layer 3 rule engine (must be fully unit-testable without models).

## Repository layout

```
blueprint-sentinel/
├── models/                        # all local model weights (gitignored, populated by setup script)
│   ├── llm/
│   ├── vision/
│   └── ocr/
├── scripts/
│   ├── download_models.py         # one-time model fetch + checksum verification
│   └── verify_offline.py          # sanity check: run the whole pipeline with network disabled
├── backend/
│   ├── main.py                    # FastAPI app entrypoint
│   ├── config.py                  # local model paths, thresholds, resolved once at startup
│   ├── pipeline/
│   │   ├── layer1_classify.py
│   │   ├── layer2_extract.py
│   │   ├── layer3_rules.py
│   │   ├── layer4_reason.py
│   │   ├── layer5_verify.py
│   │   └── orchestrator.py        # runs the five layers in sequence, assembles the final report
│   ├── schemas/
│   │   └── models.py              # Pydantic models for every inter-layer JSON contract (see below)
│   ├── rules/
│   │   └── rule_definitions.py    # the rules table described in the PRD (§7.3)
│   └── tests/
│       ├── test_layer3_rules.py
│       ├── fixtures/              # synthetic graph JSON fixtures, passing and failing, per rule
│       └── test_orchestrator.py
├── frontend/
│   └── (React + Vite app: upload, progress, report views)
├── data/
│   └── samples/                   # 2-3 demo floor plans + 1 matching electrical diagram
├── requirements.txt
├── README.md
└── models/README.md               # documents exact source/version of every downloaded model
```

## Step 1 — model download script

Write `scripts/download_models.py` that:
- Creates `models/llm/`, `models/vision/`, `models/ocr/` if missing.
- Downloads:
  - `gemma-3-4b-it-Q4_K_M.gguf` from a GGUF-quantized Gemma 3 4B instruction-tuned repo on Hugging Face Hub (use `huggingface_hub.hf_hub_download`, targeting `local_dir=models/llm`).
  - A pretrained YOLOv8n checkpoint (`ultralytics` ships `yolov8n.pt` via `YOLO("yolov8n.pt")`, which auto-downloads to a cache — explicitly move/copy the resolved weight file into `models/vision/yolov8n-symbols.pt` after download rather than leaving it in the ultralytics cache directory). If time allows, fine-tune this checkpoint on an architectural-symbols dataset and overwrite the same file; otherwise ship the base pretrained weights with that caveat documented in `models/README.md`.
  - CubiCasa5K pretrained segmentation weights, converted to ONNX, saved to `models/vision/cubicasa5k-seg.onnx`. If no ready ONNX export is available in time, implement a fallback: a simple heuristic wall/room segmenter (classical CV: edge detection + contour finding via OpenCV) behind the same interface, clearly flagged as a placeholder in `models/README.md` and in code (`# TODO: replace with fine-tuned CubiCasa5K model`).
  - EasyOCR's two weight files, fetched by instantiating `easyocr.Reader(['en'], model_storage_directory="models/ocr", download_enabled=True)` once during setup; subsequent runs use `download_enabled=False`.
- Verifies each file exists and is non-empty after download; prints a summary table of what was fetched and its local path.
- Exits non-zero with a clear message if any required file is missing, so the offline-verification step (below) can gate on it.

Also write `scripts/verify_offline.py`: disables outbound network access for the process (e.g. by pointing `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1` env vars, and refusing to proceed if any HTTP call is attempted), then runs the full pipeline against one sample from `data/samples/` end to end, and asserts it completes and produces a valid report. This is the script you run right before the demo to prove there is no hidden network dependency.

## Step 2 — inter-layer data contracts

Define these as Pydantic models in `backend/schemas/models.py`. Every layer function takes the previous layer's Pydantic object (plus, for Layer 2, the raw image) and returns its own.

```python
class PlanClassification(BaseModel):
    plan_type: Literal["floor_plan", "electrical_diagram", "network_diagram", "unknown"]
    sub_type: str | None = None
    confidence: float  # 0-1

class GraphElement(BaseModel):
    id: str
    kind: Literal["room", "wall", "door", "exit", "symbol", "panel", "node", "edge"]
    label: str | None = None
    bbox: tuple[float, float, float, float] | None = None  # x1,y1,x2,y2 in image pixels
    attributes: dict[str, str | float | bool] = {}
    confidence: float

class StructuralGraph(BaseModel):
    plan_type: str
    elements: list[GraphElement]
    adjacency: list[tuple[str, str]]  # element-id pairs that are connected/adjacent
    source_image_path: str

class RuleViolation(BaseModel):
    rule_id: str
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: list[str]
    rationale: str

class ReasoningFinding(BaseModel):
    finding_id: str
    mode: Literal["inspector", "adversarial", "cross_reference"]
    severity: Literal["low", "medium", "high", "critical"]
    element_ids: list[str]
    reasoning: str          # the model's stated chain of reasoning, not just a conclusion
    source_layer: Literal["layer4"]

class VerifiedFinding(BaseModel):
    finding_id: str
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    confidence: float
    contributing_layers: list[Literal["layer3", "layer4"]]
    element_ids: list[str]
    explanation: str        # final, user-facing, plain-language explanation
    raw_reasoning: str       # unedited reasoning trace, shown in "show your work" mode

class FinalReport(BaseModel):
    session_id: str
    plan_types: list[str]
    findings: list[VerifiedFinding]  # sorted severity desc, then confidence desc
    debug_dropped_findings: list[VerifiedFinding]  # below confidence threshold, kept for inspection
```

## Step 3 — Layer 1: classification

- File: `backend/pipeline/layer1_classify.py`.
- Load `models/llm/gemma-3-4b-it-Q4_K_M.gguf` via `llama_cpp.Llama`, with a vision-capable variant/mmproj file if you have one available locally; otherwise pass the image through the OCR/edge-detection pre-pass first and classify from extracted text + basic image stats (aspect ratio, line density) as a fallback so the layer never depends on a remote vision API.
- Prompt the model with a strict system instruction to return **only** JSON matching `PlanClassification`. Parse defensively: if the model output isn't valid JSON, retry once with a stricter "return JSON only, no prose" reminder; if it still fails, return `plan_type="unknown"`, `confidence=0.0` rather than crashing the pipeline.
- Unit test with at least 3 sample images per plan type from `data/samples/`.

## Step 4 — Layer 2: structural extraction

- File: `backend/pipeline/layer2_extract.py`.
- For `floor_plan`:
  - Run `YOLO("models/vision/yolov8n-symbols.pt")` inference to get bounding boxes for doors, exits, and any recognized symbols.
  - Run the ONNX segmentation model (`onnxruntime.InferenceSession("models/vision/cubicasa5k-seg.onnx")`) to get room/wall masks; convert masks to room polygons and compute adjacency by checking which room polygons share a boundary or are connected through a detected door.
  - Run `easyocr.Reader(['en'], model_storage_directory="models/ocr", download_enabled=False)` over the image; associate each recognized text block with the nearest detected room/symbol by bounding-box proximity.
  - Assemble everything into a `StructuralGraph`.
- For `electrical_diagram`:
  - Run OCR to extract all labeled nodes (panel IDs, equipment names).
  - Use classical CV line-detection (OpenCV `HoughLinesP` or similar) to detect connector lines between labeled nodes and build the `adjacency` edge list.
  - This path does not require a fine-tuned detector — document that explicitly as the "lighter-weight" extraction path referenced in the PRD.
- Every extracted element must carry a `confidence` score; do not silently invent a value of `1.0` — propagate the underlying model's actual score where available, or a heuristic confidence for classical-CV-derived elements.

## Step 5 — Layer 3: rule engine

- File: `backend/rules/rule_definitions.py` + `backend/pipeline/layer3_rules.py`.
- Rules are plain Python objects/functions, each taking a `StructuralGraph` and returning zero or more `RuleViolation`s. No model calls anywhere in this layer.
- Implement at minimum the five rules listed in PRD §7.3 (`EGRESS-01`, `EGRESS-02`, `ELEC-01`, `ELEC-02`, `NET-01`).
- Each rule is independently unit-tested in `backend/tests/test_layer3_rules.py` against hand-built fixture graphs in `backend/tests/fixtures/` — one fixture that should trigger the rule, one that should not. This layer must be testable and demoable without ever loading a model, and you should be able to show that in the demo ("this layer runs in milliseconds, no GPU, no model").

## Step 6 — Layer 4: AI reasoning / adversarial pass

- File: `backend/pipeline/layer4_reason.py`.
- Load the same local Gemma GGUF model (share the loaded instance with Layer 1/5 via a small model-manager singleton in `backend/pipeline/model_manager.py` — do not reload the weights per layer, that will blow the latency budget).
- Build a prompt that includes: the serialized `StructuralGraph` (elements + adjacency, trimmed to a reasonable token budget — summarize rather than dump if the graph is large), the `RuleViolation`s from Layer 3, and a mode-specific instruction:
  - Inspector mode: "You are a meticulous compliance inspector. Given this structured plan and the rule violations already found, identify any additional risks a careful human inspector would flag that these rules did not capture. Ground every claim in specific element IDs from the graph."
  - Adversarial mode: "You are red-teaming this plan for exploitable weaknesses — the single point where a failure, blockage, or intrusion would do the most damage. Ground every claim in specific element IDs from the graph."
- When two plans are supplied, add a **cross-reference call**: pass both `StructuralGraph`s together and explicitly ask for conflicts that only exist across the two documents (this is the "backup generator shares a panel with the primary load, and that panel is inside the room with the only fire exit" class of finding).
- Require strict JSON output matching a list of `ReasoningFinding`; reject and drop (with a logged warning, not a crash) any finding that references an `element_id` not present in the supplied graph — this enforces FR-4.4's grounding requirement in code, not just in the prompt.

## Step 7 — Layer 5: cross-verification

- File: `backend/pipeline/layer5_verify.py`.
- For every `RuleViolation` and `ReasoningFinding` produced so far, run a second local-LLM pass: "Here is the original structured graph and this candidate finding. Does the finding hold up? Respond with a confidence 0-1 and a one-line justification."
- Merge findings whose `element_ids` overlap substantially and whose descriptions describe the same underlying issue (simple heuristic: shared element IDs + prompt the model to confirm they're the same issue) into a single `VerifiedFinding` with `contributing_layers` listing both.
- Drop any finding with confidence below `config.CONFIDENCE_THRESHOLD` (default `0.5`) from `findings`, but keep it in `debug_dropped_findings`.
- Sort `findings` by severity (critical > high > medium > low), then by confidence descending.

## Step 8 — orchestrator and API

- `backend/pipeline/orchestrator.py`: a single function `run_pipeline(images: list[UploadedImage], mode: Literal["inspector","adversarial"]) -> FinalReport` that calls layers 1 through 5 in sequence, handles the one- or two-plan case, and returns the assembled `FinalReport`.
- `backend/main.py`: FastAPI app with:
  - `POST /analyze` — accepts one or two image uploads + mode, runs the orchestrator synchronously (fine for a demo; note in code where you'd move this to a background task/queue for production), returns `FinalReport`.
  - `GET /analyze/{session_id}/layer/{n}` — returns the raw intermediate JSON for layer `n` of a completed session, to power the "show your work" UI panel.
  - `GET /health` — returns which models are loaded and their local paths, so the demo can visibly prove nothing is remote.

## Step 9 — frontend

- Minimal React + Vite app:
  - Upload screen: one required file input (floor plan), one optional file input (electrical diagram), a mode toggle (Inspector / Adversarial).
  - Progress screen: five steps, each shown as pending → running → done, updated via polling or a simple SSE/WebSocket if you have time, polling is fine otherwise.
  - Report screen: findings list, each showing a severity badge, title, explanation, and an expandable "show your work" section with the raw reasoning trace and contributing layers.
  - A visible "Running fully offline — no data leaves this machine" indicator sourced from `GET /health`, since that is the core differentiator to lead with in the demo.

## Step 10 — tests and offline verification

- `pytest backend/tests` must pass with **zero models loaded** for the Layer 3 suite (assert this by mocking/forbidding model manager instantiation in that test module).
- `scripts/verify_offline.py` must run the full five-layer pipeline against a sample in `data/samples/` with outbound network access disabled and produce a valid `FinalReport`. Treat this script's success as the definition of done for the "local-only inference" requirement.

## Deliverable checklist (do not consider the task complete until every item is checked)

- [ ] `scripts/download_models.py` populates `models/llm/`, `models/vision/`, `models/ocr/` exactly as specified, with a printed summary.
- [ ] `models/README.md` documents the exact source and version of every model file, plus any fallback/placeholder substitutions made.
- [ ] Layer 3 rule engine passes its unit tests with no model loaded.
- [ ] Layers 1, 2, 4, 5 are wired end-to-end and produce a valid `FinalReport` on at least one sample floor plan.
- [ ] Two-plan cross-reference path produces at least one finding that Layer 3 alone does not catch.
- [ ] `scripts/verify_offline.py` passes with outbound network disabled.
- [ ] Frontend supports the full upload → progress → report flow and surfaces the offline-status indicator.
- [ ] `README.md` at the repo root documents: setup (`pip install -r requirements.txt && python scripts/download_models.py`), how to run the backend and frontend, and how to run `verify_offline.py` before a demo.

## Notes on ambiguity

Where a pretrained model isn't readily available under the exact filename specified (particularly the CubiCasa5K ONNX export and the fine-tuned symbol detector), implement the documented classical-CV or LLM-vision fallback rather than blocking on it, and clearly flag the substitution in both code comments and `models/README.md`. Do not silently degrade quality without saying so — the demo narrative explicitly benefits from being honest about what's a placeholder versus what's a fine-tuned model, per the PRD's risk section.
