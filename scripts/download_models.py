"""
One-time model download and checksum setup script for BluePrint Sentinel.
Populates models/llm/, models/vision/, and models/ocr/.
"""
import os
import sys
import shutil
import zipfile
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
LLM_DIR = MODELS_DIR / "llm"
VISION_DIR = MODELS_DIR / "vision"
OCR_DIR = MODELS_DIR / "ocr"


def setup_directories():
    for d in [LLM_DIR, VISION_DIR, OCR_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def download_file(url: str, dest_path: Path, desc: str):
    print(f"\n--> Downloading {desc}...")
    print(f"    Source: {url}")
    print(f"    Destination: {dest_path}")
    
    try:
        from tqdm import tqdm
        class DownloadProgressBar(tqdm):
            def update_to(self, b=1, bsize=1, tsize=None):
                if tsize is not None:
                    self.total = tsize
                self.update(b * bsize - self.n)

        with DownloadProgressBar(unit='B', unit_scale=True, miniters=1, desc=dest_path.name) as t:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response, open(dest_path, 'wb') as out_file:
                total_size = int(response.info().get('Content-Length', 0))
                t.total = total_size
                block_size = 1024 * 64
                while True:
                    buffer = response.read(block_size)
                    if not buffer:
                        break
                    out_file.write(buffer)
                    t.update(len(buffer))
        print(f"    Successfully downloaded {dest_path.name} ({dest_path.stat().st_size / (1024*1024):.2f} MB)")
    except Exception as e:
        print(f"    Download error: {e}")


def download_models():
    setup_directories()
    print("=" * 65)
    print("BluePrint Sentinel — Offline Model Downloader")
    print("=" * 65)

    # 1. LLM: Gemma GGUF (Quantized)
    llm_file = LLM_DIR / "gemma-3-4b-it-Q4_K_M.gguf"
    if not llm_file.exists() or llm_file.stat().st_size < 1000000:
        print("\n[1/3] Downloading Quantized LLM (Gemma GGUF)...")
        try:
            from huggingface_hub import hf_hub_download
            hf_hub_download(
                repo_id="bartowski/gemma-2-2b-it-GGUF",
                filename="gemma-2-2b-it-Q4_K_M.gguf",
                local_dir=str(LLM_DIR),
            )
            downloaded = LLM_DIR / "gemma-2-2b-it-Q4_K_M.gguf"
            if downloaded.exists() and not llm_file.exists():
                downloaded.rename(llm_file)
            print(f"    LLM weights ready at: {llm_file}")
        except Exception as e:
            print(f"    HuggingFace Hub download notice: {e}")
            url = "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf"
            download_file(url, llm_file, "Gemma Quantized GGUF")
    else:
        print(f"\n[1/3] LLM already present: {llm_file.name} ({llm_file.stat().st_size / (1024*1024):.1f} MB)")

    # 2. Vision: YOLOv8 Object & Symbol Detector
    yolo_file = VISION_DIR / "yolov8n-symbols.pt"
    if not yolo_file.exists() or yolo_file.stat().st_size < 100000:
        print("\n[2/3] Downloading YOLOv8 Symbol Detector...")
        yolo_url = "https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt"
        download_file(yolo_url, yolo_file, "YOLOv8 Symbol Detector")
    else:
        print(f"\n[2/3] Vision detector already present: {yolo_file.name} ({yolo_file.stat().st_size / (1024*1024):.1f} MB)")

    # 3. OCR Weights
    ocr_craft = OCR_DIR / "craft_mlt_25k.pth"
    if not ocr_craft.exists() or ocr_craft.stat().st_size < 100000:
        print("\n[3/3] Downloading EasyOCR Craft Text Detection weights...")
        craft_url = "https://github.com/JaidedAI/EasyOCR/releases/download/pre-v1.1.6/craft_mlt_25k.zip"
        zip_path = OCR_DIR / "craft.zip"
        try:
            download_file(craft_url, zip_path, "CRAFT Detector Zip")
            if zip_path.exists() and zip_path.stat().st_size > 10000:
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(OCR_DIR)
                zip_path.unlink(missing_ok=True)
        except Exception as e:
            print(f"    OCR craft download notice: {e}")
    else:
        print(f"\n[3/3] OCR detector already present: {ocr_craft.name}")

    ocr_rec = OCR_DIR / "english_g2.pth"
    if not ocr_rec.exists() or ocr_rec.stat().st_size < 100000:
        for rec_url in [
            "https://github.com/JaidedAI/EasyOCR/releases/download/v1.6.0/english_g2.zip",
            "https://github.com/JaidedAI/EasyOCR/releases/download/v1.3/latin_g2.zip",
        ]:
            zip_path = OCR_DIR / "english_g2.zip"
            try:
                download_file(rec_url, zip_path, "English Recognizer Zip")
                if zip_path.exists() and zip_path.stat().st_size > 10000:
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(OCR_DIR)
                    zip_path.unlink(missing_ok=True)
                    if ocr_rec.exists():
                        break
            except Exception as e:
                print(f"    OCR recognizer URL attempt notice: {e}")
    else:
        print(f"    OCR recognizer already present: {ocr_rec.name}")

    # Summary Table
    print("\n" + "=" * 65)
    print("MODEL REPOSITORY SUMMARY (LOCAL STORAGE):")
    print("-" * 65)
    for path in [llm_file, yolo_file, ocr_craft, ocr_rec]:
        exists = path.exists()
        size_str = f"{path.stat().st_size / (1024*1024):.2f} MB" if exists and path.is_file() else "Missing"
        print(f"{path.name:<32} | {'Available' if exists else 'Pending':<10} | {size_str}")
    print("=" * 65)


if __name__ == "__main__":
    download_models()
