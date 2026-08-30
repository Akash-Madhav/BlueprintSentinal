# Local Model Inventory

All models used by BluePrint Sentinel are stored locally in this directory. The system does not make outbound inference requests at runtime.

## Directory Structure

```
models/
├── llm/
│   └── gemma-3-4b-it-Q4_K_M.gguf      # Quantized Gemma 3 4B instruction tuned model (llama.cpp)
├── vision/
│   ├── yolov8n-symbols.pt             # YOLOv8n object/symbol detector (doors, exits, fixtures, panels)
│   └── cubicasa5k-seg.onnx            # CubiCasa5K room & wall segmentation (ONNX runtime)
└── ocr/
    ├── craft_mlt_25k.pth              # EasyOCR text detector
    └── english_g2.pth                 # EasyOCR text recognizer
```

## Model Sources & Fallbacks

1. **LLM (`models/llm/gemma-3-4b-it-Q4_K_M.gguf`)**:
   - Source: Hugging Face Hub (GGUF Quantized Gemma 3 4B-it).
   - Serving: `llama-cpp-python`.
   - Used in: Layer 1 (Classification), Layer 4 (AI Reasoning), Layer 5 (Cross-Verification).

2. **Symbol Detector (`models/vision/yolov8n-symbols.pt`)**:
   - Source: Ultralytics pretrained `yolov8n.pt` weights, mapped for architectural symbols.
   - Note: If fine-tuned weights are not present, symbol detection falls back to YOLO base or heuristic bounding-box analysis.

3. **Segmentation Model (`models/vision/cubicasa5k-seg.onnx`)**:
   - Source: CubiCasa5K pretrained segmentation weights exported to ONNX format.
   - Fallback: If ONNX weights are not present, Layer 2 executes a classical computer vision pipeline (OpenCV Canny edge detection + morphological contour analysis) to extract walls and room boundaries.

4. **OCR Models (`models/ocr/`)**:
   - Source: EasyOCR official PyTorch checkpoints (`craft_mlt_25k.pth`, `english_g2.pth`).
   - Managed directly with `model_storage_directory="models/ocr"`.
