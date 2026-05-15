# Adaptive Industrial Intelligence Platform
### Industry 4.0 Predictive Maintenance Ecosystem using Digital Twin Simulation & Explainable AI

---

## 🚀 Overview
The **Adaptive Industrial Intelligence Platform** is an enterprise-grade AI-driven system designed to simulate, monitor, analyze, and predict equipment failures in real time. By leveraging **Digital Twin Simulation** and **Explainable AI (XAI)**, the platform empowers industrial operators to transition from reactive maintenance to proactive, intelligent decision-making.

The system eliminates dependency on physical IoT hardware by creating a virtual digital environment that continuously generates high-fidelity industrial telemetry data.

---

## 🛠 Getting Started

### Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

### ⚡ Quick Start (Windows)
We have provided a master startup script to launch the entire platform in a single click:
1.  Navigate to the project root directory.
2.  Double-click `start_platform.bat`.
3.  This will open two separate terminal windows for the **AI Backend** and **React Frontend**.

### 🖥 Manual Execution
If you prefer to run the services separately:

**1. AI Backend (Digital Twin Engine)**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**2. React Frontend (Industrial Dashboard)**
```bash
cd frontend
npm install
npm run dev
```

---

## 💎 Premium Features
- **Digital Twin Simulation:** Virtual replicas of industrial assets (Motors, Turbines, etc.) generating live telemetry.
- **Explainable AI (XAI):** Not just a risk score, but a textual reasoning of *why* an asset is at risk.
- **Glassmorphism UI:** State-of-the-art dark theme dashboard with real-time charts and pulsing status indicators.
- **Enterprise Reports:** Full audit logs for sensor history, AI alerts, and prescriptive maintenance recommendations.
- **Simulation Control Center:** Manually inject faults or adjust global operational loads to test the AI's response.
- **CSV/Excel Integration:** Upload historical datasets for off-line AI analysis and health scoring.

---

## 🏗 Enterprise Workflow
The platform operates on a sophisticated 12-stage pipeline:
1.  **Digital Twin Simulation Layer:** Virtual replication of industrial assets.
2.  **Real-Time Telemetry Generation:** Dynamic generation of sensor values and anomaly patterns.
3.  **Data Streaming Engine:** Sub-second transmission via WebSockets.
4.  **Data Preprocessing Pipeline:** Automated scaling and cleaning.
5.  **Adaptive Analytics Engine:** Dynamic thresholding per equipment type.
6.  **AI-Based Anomaly Detection:** Statistical and ML-driven outlier identification.
7.  **Machine Learning Prediction Engine:** Failure risk classification using Random Forest models.
8.  **Explainable AI (XAI) Reasoning Layer:** Interpretable logic for risk identification.
9.  **Risk Classification System:** Health score computation (0-100%).
10. **Prescriptive Recommendation Engine:** Context-aware maintenance actions.
11. **Real-Time Industrial Dashboard:** Live monitoring of asset health.
12. **Historical Persistence:** SQLite-backed audit trails and CSV export.

---

## 📊 Technical Stack
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons.
- **Backend:** FastAPI, Uvicorn, Python 3.10+, WebSockets.
- **Intelligence:** Scikit-learn (Random Forest), Joblib, Custom XAI Logic.
- **Database:** SQLite (Relational data persistence).

---

## 🛡 License
Enterprise Industry 4.0 Project — Built for high-reliability industrial predictive maintenance.
