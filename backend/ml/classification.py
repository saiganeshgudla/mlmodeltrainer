"""
Classification demo using the Iris dataset.
Trains: Logistic Regression, Decision Tree, Random Forest, SVM, KNN
Returns step-by-step logs, per-model metrics, confusion matrix, and chart data.
"""

import time
import numpy as np
import pandas as pd
from sklearn.datasets import load_iris, load_breast_cancer, load_wine, load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report,
)


CLASSIFICATION_DATASETS = {
    "iris": {
        "name": "Iris Dataset",
        "loader": load_iris,
    },
    "breast_cancer": {
        "name": "Breast Cancer",
        "loader": load_breast_cancer,
    },
    "wine": {
        "name": "Wine Recognition",
        "loader": load_wine,
    },
    "digits": {
        "name": "Digits Dataset",
        "loader": load_digits,
    },
}


def run_classification(dataset_name="iris"):
    logs = []

    def log(msg):
        logs.append(msg)

    # 1. Load dataset
    if dataset_name not in CLASSIFICATION_DATASETS:
        dataset_name = "iris"

    config = CLASSIFICATION_DATASETS[dataset_name]
    log(f"📂 Loading {config['name']}...")
    raw_data = config["loader"]()

    df = pd.DataFrame(raw_data.data, columns=raw_data.feature_names)
    df["target"] = raw_data.target
    class_names = list(raw_data.target_names)

    log(f"✅ Loaded {len(df)} samples with {len(raw_data.feature_names)} features")
    log(f"📋 Features: {', '.join(raw_data.feature_names)}")
    log(f"🏷️  Classes: {', '.join(class_names)} ({len(class_names)} classes)")

    # 2. Split data
    log("✂️  Splitting data into 80% train / 20% test...")
    X = df[raw_data.feature_names]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    log(f"   Train: {len(X_train)} samples | Test: {len(X_test)} samples")

    # 3. Scale features
    log("⚙️  Scaling features with StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=200, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "SVM (RBF Kernel)": SVC(kernel="rbf", random_state=42),
        "KNN (k=5)": KNeighborsClassifier(n_neighbors=5),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
    }

    results = []
    best_model = None
    best_acc = -1.0
    best_name = ""

    for name, model in models.items():
        log(f"🏋️  Training {name}...")
        start = time.time()
        model.fit(X_train_scaled, y_train)
        train_time = time.time() - start

        y_pred = model.predict(X_test_scaled)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

        results.append({
            "model": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "train_time": round(train_time, 3),
        })

        log(f"   ✅ {name}: Accuracy={acc:.4f} | F1={f1:.4f} ({train_time:.3f}s)")

        if acc > best_acc:
            best_acc = acc
            best_model = model
            best_name = name

    log(f"🏆 Best model: {best_name} (Accuracy={best_acc:.4f})")

    # 5. Confusion matrix for best model
    y_pred_best = best_model.predict(X_test_scaled)
    cm = confusion_matrix(y_test, y_pred_best)
    confusion_matrix_data = {
        "labels": class_names,
        "matrix": cm.tolist(),
    }

    # 6. Classification report for best model
    report = classification_report(y_test, y_pred_best, target_names=class_names, output_dict=True)
    per_class_metrics = [
        {"class": cn, "precision": round(report[cn]["precision"], 4),
         "recall": round(report[cn]["recall"], 4),
         "f1_score": round(report[cn]["f1-score"], 4),
         "support": int(report[cn]["support"])}
        for cn in class_names
    ]

    # 7. Feature importance from best model
    feature_importance = _get_feature_importance(best_model, raw_data.feature_names)

    log("📊 Training complete! Results ready.")

    # 8. EDA
    eda = _compute_eda_classification(df, raw_data.feature_names, class_names)

    return {
        "dataset": {
            "name": config["name"],
            "samples": len(df),
            "features": len(raw_data.feature_names),
            "classes": len(class_names),
            "class_names": class_names,
            "description": raw_data.get("DESCR", "")[:300],
        },
        "logs": logs,
        "metrics": results,
        "best_model": best_name,
        "confusion_matrix": confusion_matrix_data,
        "per_class_metrics": per_class_metrics,
        "feature_importance": feature_importance,
        "eda": eda,
    }


def _compute_eda_classification(df, feature_names, class_names):
    """Compute EDA stats for Iris dataset."""
    # Class distribution
    class_dist = [
        {"class": class_names[i], "count": int((df["target"] == i).sum())}
        for i in range(len(class_names))
    ]

    # Feature stats per feature
    feature_stats = []
    for col in feature_names:
        s = df[col]
        feature_stats.append({
            "feature": col,
            "mean": round(float(s.mean()), 4),
            "std": round(float(s.std()), 4),
            "min": round(float(s.min()), 4),
            "max": round(float(s.max()), 4),
        })

    # Feature correlation matrix
    feat_df = df[list(feature_names)]
    corr = feat_df.corr().round(3)
    correlation = {
        "labels": list(feature_names),
        "matrix": corr.values.tolist(),
    }

    return {
        "class_distribution": class_dist,
        "feature_stats": feature_stats,
        "correlation": correlation,
    }


def _get_feature_importance(model, feature_names):
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_).mean(axis=0).flatten()
        else:
            return []

        pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        return [{"feature": f, "importance": round(float(v), 4)} for f, v in pairs]
    except Exception:
        return []
