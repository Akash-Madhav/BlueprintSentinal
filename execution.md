# BluePrint Sentinel Execution Guide

BluePrint Sentinel is a modern, standalone web application that executes an autonomous five-layer infrastructure plan audit pipeline (classify → extract → codified rule verification → AI reasoning → cross-verification & resilience grading) using Google Gemini Multimodal AI.

## Setup & Running the Application

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Your Google Gemini API Key
You can configure your Google API Key in either of two ways:
1. **Via Environment Variable:**
   Create a `frontend/.env` file:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. **Via Application Interface:**
   Launch the app and click the **SET GEMINI API KEY** button in the top navigation bar to enter and validate your key directly in the browser (persisted securely in `localStorage`).

### 3. Start the Application
```bash
cd frontend
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## Testing the Application

1. Open `http://localhost:5173` in your browser.
2. Click **"Load Official Test Scenario"** to instantly load the paired Architectural Floor Plan and Electrical Schematic.
3. Select your audit mode (**Inspector Mode** or **Adversarial Red-Team Mode**).
4. Click **"Execute Autonomous 5-Layer Infrastructure Audit"**.
5. Explore the interactive visual blueprint inspector with SVG bounding box overlays, resilience scorecard (0-100 & Grade), itemized code citations (NFPA, IBC, NEC, IEEE), and export capabilities (JSON & Markdown).
