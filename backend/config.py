import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
SAMPLES_DIR = DATA_DIR / "samples"

# Model Paths
LLM_DIR = MODELS_DIR / "llm"
VISION_DIR = MODELS_DIR / "vision"
OCR_DIR = MODELS_DIR / "ocr"

LLM_MODEL_PATH = LLM_DIR / "gemma-3-4b-it-Q4_K_M.gguf"
YOLO_MODEL_PATH = VISION_DIR / "yolov8n-symbols.pt"
SEGMENTATION_MODEL_PATH = VISION_DIR / "cubicasa5k-seg.onnx"

OCR_CRAFT_PATH = OCR_DIR / "craft_mlt_25k.pth"
OCR_RECOGNITION_PATH = OCR_DIR / "english_g2.pth"

# Pipeline Configuration
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
MAX_LLM_TOKENS = int(os.getenv("MAX_LLM_TOKENS", "1024"))
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.0"))

# Thresholds for Layer 3 Rules
MAX_EGRESS_INTERMEDIATE_ROOMS = int(os.getenv("MAX_EGRESS_INTERMEDIATE_ROOMS", "2"))
HIGH_OCCUPANCY_THRESHOLD = int(os.getenv("HIGH_OCCUPANCY_THRESHOLD", "50"))
MIN_EXITS_FOR_HIGH_OCCUPANCY = int(os.getenv("MIN_EXITS_FOR_HIGH_OCCUPANCY", "2"))
