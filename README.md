# Industrial Predictive Maintenance AI
### Real-Time Sensor Simulation and Failure Prediction System

---

## Quick Start

### Option 1 — One Click (Recommended)
Double-click **`START_ALL.bat`** in the root folder.  
This opens two terminal windows:
- **Backend** → `http://localhost:8000`
- **Frontend** → `http://localhost:5173`

---

### Option 2 — Manual

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## How It Works

1. **On first start**, the backend auto-trains the Random Forest model (~12,000 synthetic samples) and saves it to `backend/app/models/saved_models/`.
2. **Every 2 seconds**, the simulation engine generates sensor readings for 8 equipment units.
3. **ML inference** classifies each reading as `Healthy`, `Warning`, or `Critical`.
4. **WebSocket** pushes updates to the React dashboard in real time.
5. **Alerts** and **AI recommendations** are generated based on threshold rules + ML predictions.

---

## URLs

| Service      | URL |
|---|---|
| Dashboard    | http://localhost:5173 |
| API Docs     | http://localhost:8000/docs |
| WebSocket    | ws://localhost:8000/ws |
| Health Check | http://localhost:8000/health |

---

## Tech Stack

| Layer      | Technology |
|---|---|
| Frontend   | React 18 + Vite + Tailwind CSS + Recharts |
| Backend    | FastAPI + Uvicorn + WebSockets |
| ML Engine  | Scikit-learn Random Forest |
| Database   | SQLite (auto-created) |

---

## Equipment Simulated

| ID     | Name          | Type        |
|--------|---------------|-------------|
| EQ-001 | Motor A       | Motor       |
| EQ-002 | Transformer B | Transformer |
| EQ-003 | Generator C   | Generator   |
| EQ-004 | Turbine D     | Turbine     |
| EQ-005 | Pump Station 1| Pump        |
| EQ-006 | Exhaust Fan 1 | Fan         |
| EQ-007 | Compressor X  | Compressor  |
| EQ-008 | Conveyor Belt | Conveyor    |

---

## Sensors Monitored

Temperature · Vibration · Voltage · Current · Pressure · RPM

---

## Risk Classification

| Color  | Label    | Action |
|--------|----------|--------|
| 🟢 Green | Healthy  | Normal operation |
| 🟡 Yellow | Warning | Schedule maintenance |
| 🔴 Red  | Critical | Immediate action required |
