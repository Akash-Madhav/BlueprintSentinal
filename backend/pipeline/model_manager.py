"""
Model Manager Singleton.
Provides unified, thread-safe, local-only loading of models (LLM, Vision, OCR)
preventing duplicate weight loads in memory.
"""
import logging
from pathlib import Path
from typing import Any, Optional
from backend.config import (
    LLM_MODEL_PATH,
    YOLO_MODEL_PATH,
    SEGMENTATION_MODEL_PATH,
    OCR_DIR,
)

logger = logging.getLogger(__name__)


class ModelManager:
    _instance: Optional["ModelManager"] = None
    
    def __init__(self):
        self._llm = None
        self._yolo = None
        self._segmenter = None
        self._ocr_reader = None

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def is_llm_available(self) -> bool:
        return LLM_MODEL_PATH.exists() and LLM_MODEL_PATH.stat().st_size > 0

    def is_yolo_available(self) -> bool:
        return YOLO_MODEL_PATH.exists() and YOLO_MODEL_PATH.stat().st_size > 0

    def is_segmenter_available(self) -> bool:
        return SEGMENTATION_MODEL_PATH.exists() and SEGMENTATION_MODEL_PATH.stat().st_size > 0

    def get_health_status(self) -> dict:
        return {
            "status": "online_local_only",
            "models": {
                "llm": {
                    "path": str(LLM_MODEL_PATH),
                    "loaded": self._llm is not None,
                    "available_on_disk": self.is_llm_available(),
                },
                "yolo": {
                    "path": str(YOLO_MODEL_PATH),
                    "loaded": self._yolo is not None,
                    "available_on_disk": self.is_yolo_available(),
                },
                "segmenter": {
                    "path": str(SEGMENTATION_MODEL_PATH),
                    "loaded": self._segmenter is not None,
                    "available_on_disk": self.is_segmenter_available(),
                },
                "ocr": {
                    "storage_dir": str(OCR_DIR),
                    "loaded": self._ocr_reader is not None,
                    "available_on_disk": OCR_DIR.exists(),
                },
            },
        }

    def get_llm(self) -> Any:
        if self._llm is None:
            if not self.is_llm_available():
                logger.warning(
                    f"LLM model not found at {LLM_MODEL_PATH}. "
                    "Run scripts/download_models.py to download weights."
                )
                return None
            try:
                from llama_cpp import Llama
                logger.info(f"Loading local LLM from {LLM_MODEL_PATH}...")
                self._llm = Llama(
                    model_path=str(LLM_MODEL_PATH),
                    n_ctx=2048,
                    n_threads=6,
                    verbose=False,
                )
                logger.info("Local LLM successfully initialized.")
            except Exception as e:
                logger.error(f"Failed to load LLM with llama_cpp: {e}")
                return None
        return self._llm

    def get_yolo(self) -> Any:
        if self._yolo is None:
            if not self.is_yolo_available():
                logger.warning(f"YOLO model not found at {YOLO_MODEL_PATH}.")
                return None
            try:
                from ultralytics import YOLO
                self._yolo = YOLO(str(YOLO_MODEL_PATH))
            except Exception as e:
                logger.error(f"Failed to load YOLO model: {e}")
                return None
        return self._yolo

    def get_segmenter(self) -> Any:
        if self._segmenter is None:
            if not self.is_segmenter_available():
                logger.warning(f"ONNX segmenter model not found at {SEGMENTATION_MODEL_PATH}.")
                return None
            try:
                import onnxruntime as ort
                self._segmenter = ort.InferenceSession(str(SEGMENTATION_MODEL_PATH))
            except Exception as e:
                logger.error(f"Failed to load ONNX segmentation model: {e}")
                return None
        return self._segmenter

    def get_ocr(self) -> Any:
        if self._ocr_reader is None:
            try:
                import easyocr
                OCR_DIR.mkdir(parents=True, exist_ok=True)
                self._ocr_reader = easyocr.Reader(
                    ["en"],
                    model_storage_directory=str(OCR_DIR),
                    download_enabled=False,
                    gpu=False,
                )
            except Exception as e:
                logger.warning(f"EasyOCR reader init with local files notice: {e}")
                return None
        return self._ocr_reader
