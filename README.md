# AutoML Studio 🤖

A **No-Code Machine Learning platform** — upload a CSV, select a target column, and train models in real-time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + TailwindCSS + Recharts |
| Backend | FastAPI + Python |
| Database | SQLite (SQLAlchemy) |
| Task Queue | Celery + Redis |
| ML Engine | PyCaret (auto-handles dirty data) |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Redis running on `localhost:6379`

**Start Redis (easiest via Docker):**
```bash
docker run -d -p 6379:6379 redis
```
> **No Docker?** Install Redis via WSL: `sudo apt install redis` then `redis-server`

---

### 1 — Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies (~1-2 GB for PyCaret)
pip install -r requirements.txt

# Terminal 1 — Start FastAPI
uvicorn main:app --reload --port 8000

# Terminal 2 — Start Celery worker (use --pool=solo on Windows)
celery -A worker.celery_app worker --loglevel=info --pool=solo
```

### 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
mlmodeltrainer/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings (Pydantic)
│   ├── database.py          # SQLite + SQLAlchemy
│   ├── models.py            # Pydantic + ORM models
│   ├── routes/
│   │   ├── upload.py        # POST /upload
│   │   ├── train.py         # POST /train
│   │   ├── results.py       # GET /results/{task_id}
│   │   └── ws.py            # WS /ws/{task_id}
│   ├── worker/
│   │   ├── celery_app.py    # Celery config
│   │   └── tasks.py         # train_model task
│   ├── ml/
│   │   ├── automl.py        # PyCaret pipeline
│   │   └── detect.py        # Regression/Classification detection
│   ├── requirements.txt
│   └── .env
└── frontend/
    └── src/
        ├── App.jsx           # Router + Layout
        ├── context/
        │   └── AppContext.jsx
        ├── hooks/
        │   └── useWebSocket.js
        ├── lib/
        │   └── api.js
        ├── components/
        │   └── Stepper.jsx
        └── pages/
            ├── Upload.jsx    # Drag-and-drop upload
            ├── Configure.jsx # Column preview + target select
            ├── Training.jsx  # Live log terminal
            └── Results.jsx   # Metrics + charts dashboard
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/upload` | Upload a CSV, returns columns + preview |
| `POST` | `/train` | Start training, returns `task_id` |
| `GET` | `/results/{task_id}` | Fetch job status + results |
| `WS` | `/ws/{task_id}` | Stream training logs |
| `GET` | `/health` | Health check |

---

## Sample Test

Try with the Iris dataset:
```bash
curl -F "file=@iris.csv" http://localhost:8000/upload
# → { "filename": "abc123_iris.csv", "columns": [...] }

curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{"filename": "abc123_iris.csv", "target_col": "species"}'
# → { "task_id": "...", "status": "pending" }
```

---

## Notes

- **Windows + Celery**: use `--pool=solo` flag on the worker
- **PyCaret** automatically handles imputation and one-hot encoding
- Problem type (Regression vs Classification) is **auto-detected**
- The WebSocket closes automatically when training finishes
