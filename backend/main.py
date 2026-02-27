from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from ml.regression import run_regression, REGRESSION_DATASETS
from ml.classification import run_classification, CLASSIFICATION_DATASETS
from ml.clustering import run_clustering, CLUSTERING_DATASETS

app = FastAPI(
    title="ML Model Trainer — Sklearn Showcase",
    description="Demonstrates Regression, Classification, and Clustering using sklearn datasets.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}


# ── Regression ──────────────────────────────────────────────────
@app.get("/api/regression/datasets")
def list_regression_datasets():
    return [{"id": k, "name": v["name"]} for k, v in REGRESSION_DATASETS.items()]


@app.get("/api/regression/train")
def train_regression(dataset: str = "california"):
    """Train regression models on selected dataset."""
    return run_regression(dataset)


# ── Classification ──────────────────────────────────────────────
@app.get("/api/classification/datasets")
def list_classification_datasets():
    return [{"id": k, "name": v["name"]} for k, v in CLASSIFICATION_DATASETS.items()]


@app.get("/api/classification/train")
def train_classification(dataset: str = "iris"):
    """Train classification models on selected dataset."""
    return run_classification(dataset)


# ── Clustering ─────────────────────────────────────────────────
@app.get("/api/clustering/datasets")
def list_clustering_datasets():
    return [{"id": k, "name": v["name"]} for k, v in CLUSTERING_DATASETS.items()]


@app.get("/api/clustering/train")
def train_clustering(dataset: str = "iris"):
    """Train clustering models on selected dataset."""
    return run_clustering(dataset)

