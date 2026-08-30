# BluePrint Sentinel Execution Guide

This document covers the setup, execution, and verification steps for the BluePrint Sentinel system.

## Setup

1. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Download Models:**
   Run the setup script to download the required LLM, vision, and OCR models into the `models/` directory. All models are loaded from the local disk at runtime to ensure a fully offline system.
   ```bash
   python scripts/download_models.py
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

## Running the Application

### 1. Start the Backend (FastAPI)
The backend runs on Python and provides the API for the application.
```bash
uvicorn backend.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 2. Start the Frontend (React + Vite)
In a new terminal window:
```bash
cd frontend
npm run dev
```
The frontend will typically be available at `http://localhost:5173`.

## Verifying Offline Capabilities

Before a demo, you can verify that the system is fully capable of running offline (without making any external network API calls):

```bash
python scripts/verify_offline.py
```

This script will disable outbound network access for the process and run the full pipeline against a sample from `data/samples/` end-to-end to ensure it completes and produces a valid report without external dependencies.
