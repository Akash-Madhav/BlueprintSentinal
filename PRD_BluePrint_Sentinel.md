# BluePrint Sentinel — Product Requirements Document

**Track:** Track 1 — Autonomous AI for Critical Infrastructure
**Event:** Intellect Hack 2026
**Version:** 1.0 (Hackathon MVP)
**Status:** Draft for build

---

## 1. Summary

BluePrint Sentinel is an autonomous AI system that ingests infrastructure plans — architectural floor plans, electrical single-line diagrams, and network/server topology diagrams — and audits them for safety, redundancy, and security vulnerabilities. It runs the plan through a five-layer verification pipeline (classify → extract → rule-check → reason → cross-verify) and produces a severity-ranked, explainable report of every issue found, including issues that only emerge when two plan types are cross-referenced against each other.

The system is designed to run **fully offline on local hardware**: every model it uses (vision, OCR, and language) is downloaded once into a local `models/` directory and loaded from disk at runtime. No inference call is made to an external API. This is a deliberate architecture decision, not just a hackathon convenience — critical infrastructure plans are sensitive documents, and a real deployment (power utility, hospital, government facility) cannot send them to a third-party cloud API.

## 2. Problem statement

- Infrastructure plans are still reviewed manually by engineers and inspectors, one discipline at a time.
- A floor plan and its matching electrical schematic can each look individually compliant, yet conflict when combined (e.g. the backup generator feeds the same panel as the primary; the only emergency-lit corridor is also the only fire exit).
- Reviews are rarely re-run when a plan changes mid-project, so late edits go unchecked.
- A single missed vulnerability — a blocked exit, a single point of failure, an unmonitored access point — can cascade into a real safety or security failure.
- Existing AI document-analysis tools either (a) call cloud vision APIs, which is a non-starter for sensitive infrastructure documents, or (b) do a single-shot "describe this image" pass with no verification step, which produces unreliable, unexplainable output.

## 3. Goals

1. Given an uploaded plan image, correctly classify its type and route it to the correct rule set.
2. Extract a structured, machine-readable representation of the plan (rooms, exits, wiring nodes, labels) that downstream layers can reason over.
3. Flag known, codified rule violations deterministically and traceably.
4. Use a language model to find context-dependent risks that fixed rules cannot express, including an adversarial "red-team" mode.
5. Re-verify every flagged issue before it reaches the report, to suppress false positives and consolidate duplicate findings.
6. Support **cross-referencing two plans of different types** (e.g. floor plan + electrical) to catch compromises invisible to either plan alone.
7. Run the entire pipeline with all models resident on local disk — zero runtime calls to external inference APIs.
8. Produce a report a non-technical stakeholder can read: severity, location, plain-language reasoning, and which layer raised each finding.

### Non-goals (out of scope for this version)

- Real-time video or drone-feed analysis (Track 1's hardware-oriented ideas are explicitly excluded from this build).
- Automatic remediation (the system flags issues; it does not edit the plan or generate fixes).
- Full multi-jurisdiction building-code coverage — the rule engine ships with a representative rule set (fire egress, electrical redundancy, network SPOF), not an exhaustive code library.
- Training new vision models from scratch — the CV layer fine-tunes/uses existing pretrained weights.
- Multi-user auth, billing, or a production deployment story beyond a local/self-hosted demo.

## 4. Target users

- **Hackathon judges** (primary audience for this build): need a working, explainable, live demo.
- **Facility/infrastructure engineers**: would use this pre-submission to catch issues before a formal review.
- **Compliance inspectors**: would use this as a first-pass triage tool before a manual site visit.
- **Regulated-industry IT/security teams** (power, healthcare, government): the "runs fully local, nothing leaves the building" story is aimed directly at this persona.

## 5. Scope for the hackathon MVP

**In scope:**
- Single plan type fully supported end-to-end: **architectural floor plan**.
- Second plan type supported for cross-referencing: **electrical single-line diagram** (lighter-weight extraction, rule-only + LLM reasoning, no dedicated fine-tuned CV model required).
- All five layers implemented and wired together.
- A minimal web UI: upload one or two plans → see the layer-by-layer pipeline execute → see the final report with severity, location callouts, and reasoning trace.
- Adversarial ("red-team") mode toggle on Layer 4.
- All models downloaded to and loaded from `./models/`.

**Stretch (if time remains):**
- Network/server topology diagrams as a third plan type.
- Bounding-box overlay on the original image showing exactly where each issue was found.
- Exportable PDF/JSON report.
- A fine-tuned (rather than off-the-shelf) detector on CubiCasa5K.

## 6. System overview — the five-layer pipeline

| Layer | Name | Purpose | Primary tech |
|---|---|---|---|
| 1 | Classification | Identify plan type, route to correct rule set | Local LLM (vision-capable) |
| 2 | Structural extraction | Convert image → structured component graph | Local CV (detector + segmenter) + local OCR |
| 3 | Domain rule verification | Deterministic checks against codified standards | Pure code, rules table, no model |
| 4 | AI reasoning / adversarial pass | Context-dependent issues rules can't express | Local LLM |
| 5 | Cross-verification | Re-check every flag, consolidate, drop low-confidence noise | Local LLM + code |

Each layer consumes the previous layer's structured output (JSON) and appends its own findings — never raw prose — so the pipeline stays inspectable and each finding is traceable back to the layer and evidence that produced it.

## 7. Functional requirements

### 7.1 Layer 1 — Classification

- **FR-1.1**: Accept an uploaded image (PNG/JPG) or PDF (first page rasterized) as input.
- **FR-1.2**: Classify the plan into one of: `floor_plan`, `electrical_diagram`, `network_diagram`, `unknown`.
- **FR-1.3**: Return a confidence score (0–1). If confidence < 0.6, surface `unknown` and prompt the user to confirm the type manually rather than silently guessing.
- **FR-1.4**: Output a sub-type where discernible (e.g. `floor_plan / residential / single-story`).
- **Acceptance criteria**: given 10 held-out sample plans (mixed types), classification accuracy ≥ 90%, and the system never runs Layer 3 rules for the wrong plan type.

### 7.2 Layer 2 — Structural extraction

- **FR-2.1**: For `floor_plan` inputs, detect and localize: rooms, walls, doors, windows, fire exits, and any labeled symbols (fire extinguisher, electrical panel, etc.), each with a bounding box.
- **FR-2.2**: Segment the floor plan into room polygons; compute adjacency between rooms (which rooms share a wall/door).
- **FR-2.3**: Run OCR over the image to extract all text labels (room names, dimensions, panel IDs) and associate each label with the nearest detected symbol/region.
- **FR-2.4**: For `electrical_diagram` inputs, extract nodes (panels, transformers, generators, loads) and edges (wiring connections) into a graph — this may use a lighter-weight approach (OCR + line-detection heuristics) rather than a fine-tuned detector, since no public pretrained electrical-symbol dataset is assumed available.
- **FR-2.5**: Emit a single structured JSON document per plan (see §12 for schema) with a per-element confidence score.
- **Acceptance criteria**: on the demo floor plan, ≥ 85% of rooms and all fire exits are correctly detected and labeled; the room-adjacency graph is exportable and matches manual inspection.

### 7.3 Layer 3 — Domain rule verification

- **FR-3.1**: Implement a rules table, keyed by plan type, of deterministic checks. Each rule has: id, description, applicable plan type(s), the condition it checks against the structured graph, severity, and a human-readable citation/rationale.
- **FR-3.2**: Ship with at minimum these rules:
  - `EGRESS-01`: every room must have a path to an exit through ≤ N intermediate rooms (configurable, default 2).
  - `EGRESS-02`: a floor with occupancy above a threshold must have ≥ 2 independent exits.
  - `ELEC-01`: a backup power source must not share a panel/circuit with the primary source for any load tagged "critical."
  - `ELEC-02`: no single circuit may exceed its rated load (if load values are present in the extracted graph).
  - `NET-01`: no single network node may be the only path between two "critical" nodes (single point of failure).
- **FR-3.3**: Each rule violation is emitted with: rule id, severity (`low`/`medium`/`high`/`critical`), the specific elements involved (referencing Layer 2 element IDs), and the rule's plain-language rationale.
- **Acceptance criteria**: rules are unit-testable in isolation against synthetic graph fixtures, independent of the CV pipeline; 100% of shipped rules have a passing and a failing test fixture.

### 7.4 Layer 4 — AI reasoning / adversarial pass

- **FR-4.1**: Feed the Layer 2 structured graph and the Layer 3 rule violations to a local LLM with a reasoning prompt that asks it to identify additional, context-dependent issues not captured by fixed rules.
- **FR-4.2**: Support two modes, user-selectable:
  - **Inspector mode**: "what would a careful compliance inspector flag here?"
  - **Adversarial / red-team mode**: "if you were trying to exploit a weakness in this layout, what would you target?"
- **FR-4.3**: When two plans are supplied (e.g. floor plan + electrical), run a **cross-reference pass**: feed both structured graphs together and specifically prompt for conflicts that only exist across the two documents.
- **FR-4.4**: Every Layer 4 finding must include the model's stated reasoning (not just a label), and reference specific Layer 2 element IDs it is reasoning about — free-floating findings with no graph grounding are rejected before being added to the report.
- **Acceptance criteria**: on the demo cross-reference scenario (floor plan + electrical), the system surfaces at least one issue that Layer 3's rules alone do not catch, with a coherent, grounded explanation.

### 7.5 Layer 5 — Cross-verification

- **FR-5.1**: For every candidate finding from Layers 3 and 4, run a second local-LLM pass that re-examines the finding against the original structured graph and asks "does this hold up on a second look?"
- **FR-5.2**: Merge duplicate/overlapping findings from Layers 3 and 4 that describe the same underlying issue into a single consolidated finding, listing all contributing layers.
- **FR-5.3**: Assign a final confidence score to every finding; drop findings below a configurable confidence threshold (default 0.5) from the final report, but retain them in a debug log.
- **FR-5.4**: Sort the final report by severity, then confidence.
- **Acceptance criteria**: false-positive rate on the demo plan set is visibly reduced versus reporting Layer 3+4 output unfiltered (measured by manual review of a held-out set).

### 7.6 Reporting / UI

- **FR-6.1**: Web UI to upload one or two plans, select analysis mode (inspector/adversarial), and trigger the pipeline.
- **FR-6.2**: Live progress indicator showing which of the five layers is currently executing.
- **FR-6.3**: Final report view: list of findings, each showing severity badge, title, plain-language explanation, contributing layer(s), and (stretch) a bounding-box overlay on the source image.
- **FR-6.4**: A way to inspect the raw structured JSON at each layer, for demo/judging transparency ("show your work" mode).

## 8. Non-functional requirements

- **NFR-1 (Local-only inference)**: every model used by the system — vision, OCR, and language — must be downloaded once to `./models/` and loaded from local disk at runtime. The application must have a documented "offline mode" and must not make outbound calls to any hosted inference API (OpenAI, Anthropic, Google, etc.) during normal operation. See §9 for the full model inventory.
- **NFR-2 (Reproducible setup)**: a single setup script (`scripts/download_models.py` or `make setup`) downloads every required model file with checksum verification, so a fresh machine can go from clean clone to fully offline-capable in one command (given internet access at setup time only).
- **NFR-3 (Performance)**: end-to-end pipeline latency on the demo floor plan should be ≤ 60 seconds on a laptop-class CPU, and ≤ 20 seconds if a local GPU is available. This is a demo constraint, not a production SLA.
- **NFR-4 (Explainability)**: every finding in the final report must be traceable to the layer, model/rule, and underlying graph elements that produced it. No finding may appear in the report without a stored reasoning trace.
- **NFR-5 (Determinism where it matters)**: Layer 3 (rules) must be fully deterministic and unit-testable without invoking any model. Layers 1, 4, and 5 (LLM-based) should use a fixed random seed / temperature=0 where the local inference engine supports it, to keep demo behavior consistent.
- **NFR-6 (Data handling)**: uploaded plans and all intermediate artifacts stay on local disk under a per-session working directory; nothing is uploaded elsewhere.

## 9. Model & data inventory — all local, all in `models/`

No model in this system is called over a network API at inference time. Every model below is downloaded once (setup time) into the local `models/` directory and loaded from disk.

| Model | Role | Layer(s) | Format | Approx. size |
|---|---|---|---|---|
| `models/llm/gemma-3-4b-it-Q4_K_M.gguf` | General reasoning: classification, adversarial reasoning, cross-verification | 1, 4, 5 | GGUF (quantized), served via `llama.cpp` / Ollama | ~2.5 GB |
| `models/vision/yolov8n-symbols.pt` | Symbol/object detection: doors, exits, panels, fixtures | 2 | Ultralytics `.pt` | ~6 MB |
| `models/vision/cubicasa5k-seg.onnx` | Room/wall segmentation for floor plans | 2 | ONNX | ~40–80 MB |
| `models/ocr/craft_mlt_25k.pth` | Text detection (EasyOCR detector) | 2 | PyTorch | ~80 MB |
| `models/ocr/english_g2.pth` | Text recognition (EasyOCR recognizer) | 2 | PyTorch | ~15 MB |

Notes:
- `gemma-3-4b-it` is used for both the classification layer and the reasoning/verification layers to minimize the number of distinct models that must be downloaded and kept resident in memory; if the demo machine has a GPU, the non-quantized or a higher-precision variant may be substituted, still stored locally under the same path convention.
- The vision detector (`yolov8n-symbols.pt`) starts from a general pretrained YOLOv8n checkpoint and is fine-tuned (or used zero-shot for the demo if time-constrained) on architectural symbol classes.
- The segmentation model is derived from the public **CubiCasa5K** dataset's published pretrained weights, converted to ONNX for fast local CPU inference.
- If any of the above cannot be sourced pretrained in time, the fallback is to route that sub-task through the local `gemma-3-4b-it` vision-capable variant instead — still local, still no external API call, at some accuracy cost that should be disclosed in the demo.

## 10. Data contracts between layers

See the companion implementation prompt for full JSON schemas. In brief, each layer's output is a versioned JSON document; each layer only ever reads the previous layer's JSON output plus the original image, never re-parses raw prose from an earlier layer.

## 11. User flow (primary demo path)

1. User opens the web UI, uploads a floor plan image.
2. (Optional) User uploads a second, related electrical diagram for cross-referencing.
3. User selects analysis mode: Inspector or Adversarial.
4. User clicks "Analyze." The UI shows live progress through Layers 1–5.
5. Report view renders: findings sorted by severity, each with an explanation and source layer.
6. User can click "show your work" to inspect the structured JSON at any layer.
7. (Stretch) User exports the report as PDF/JSON.

## 12. Success metrics (for the hackathon demo)

- Pipeline runs end-to-end, live, on stage, without a network connection.
- At least one finding in the demo report is a genuine cross-plan issue that would be non-obvious to a single-discipline reviewer.
- Judges can trace any finding back to its evidence within the UI without the presenter needing to explain "trust me."
- Setup-to-offline-demo time (on a fresh machine, with internet access) is under 15 minutes.

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Fine-tuned CV models underperform on unfamiliar plan styles | Keep the demo plan set fixed and known-good; document the LLM-vision fallback path |
| Local LLM (Gemma 3 4B, quantized) reasoning quality is weaker than a frontier hosted model | Keep Layer 4/5 prompts narrow and structured (grounded in the graph, not open-ended); accept and disclose this as the real-world trade-off for data sovereignty |
| End-to-end latency too slow for a live demo | Pre-warm models before the demo starts; have a pre-computed run cached as a fallback |
| Model downloads fail on venue Wi-Fi | Run `scripts/download_models.py` well before the event; ship the `models/` directory on a USB drive as backup |
| Rule engine is too narrow to look credible | Focus the demo narrative on the small, well-tested rule set rather than claiming code-complete coverage |

## 14. Hackathon milestones

1. Repo scaffold + model download script working end-to-end (all five files land in `models/`).
2. Layer 3 rule engine implemented and unit-tested in isolation (no dependency on 1/2/4/5).
3. Layer 2 extraction pipeline producing structured JSON on the demo floor plan.
4. Layer 1 classification wired in front of Layer 2.
5. Layer 4 reasoning pass wired in, both modes working.
6. Layer 5 verification pass wired in, report deduplication working.
7. Minimal UI: upload → progress → report.
8. Cross-reference path (two plans) working for the demo scenario.
9. Full offline dry run on the actual demo machine.

## 15. Out of scope / future work

- Full building-code rule libraries per jurisdiction.
- Automatic plan remediation/redlining.
- Drone/hardware sensor integration (explicitly excluded — this is the software-only pivot from the original Track 1 brainstorm).
- Multi-tenant, authenticated, cloud-hosted deployment.
- Fine-tuning the LLM itself on domain-specific inspection data (v2 idea, noted in the original design discussion).
