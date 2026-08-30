# BluePrint Sentinel

**Autonomous AI for Critical Infrastructure**

BluePrint Sentinel is an autonomous AI system that ingests infrastructure plans — architectural floor plans, electrical single-line diagrams, and network/server topology diagrams — and audits them for safety, redundancy, and security vulnerabilities. It runs the plan through a five-layer verification pipeline and produces a severity-ranked, explainable report of every issue found.

The system is designed to run **fully offline on local hardware**: every model it uses (vision, OCR, and language) is loaded from local disk at runtime. This is a deliberate architecture decision, as critical infrastructure plans are sensitive documents that cannot be sent to third-party cloud APIs.

## Problem Statement

- Infrastructure plans are typically reviewed manually by engineers and inspectors, one discipline at a time.
- A floor plan and its matching electrical schematic can each look individually compliant, yet conflict when combined (e.g. the backup generator feeds the same panel as the primary).
- A single missed vulnerability — a blocked exit, a single point of failure, an unmonitored access point — can cascade into a real safety or security failure.
- Existing AI tools often rely on cloud APIs which compromise data sovereignty for sensitive infrastructure.

## System Overview — The Five-Layer Pipeline

BluePrint Sentinel implements a unique multi-layered approach to document and plan analysis:

1. **Classification**: Identify plan type, route to the correct rule set (Local Vision-capable LLM).
2. **Structural Extraction**: Convert image to a structured component graph (Local CV + Local OCR).
3. **Domain Rule Verification**: Deterministic checks against codified standards (Pure code, no model).
4. **AI Reasoning / Adversarial Pass**: Context-dependent issues rules can't express. Supports an adversarial "red-team" mode. (Local LLM).
5. **Cross-Verification**: Re-check every flag, consolidate, and drop low-confidence noise (Local LLM + code).

## Execution & Setup

Please refer to [execution.md](./execution.md) for detailed instructions on how to set up the local models, install dependencies, and run the system.
