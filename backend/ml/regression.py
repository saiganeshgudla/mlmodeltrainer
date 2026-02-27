"""
Regression demo using California Housing dataset.
Trains: Linear Regression, Decision Tree, Random Forest, SVR
Returns step-by-step logs, per-model metrics, and chart data.
"""

import time
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing, load_diabetes, load_linnerud
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score


REGRESSION_DATASETS = {
    "california": {
        "name": "California Housing",
        "loader": fetch_california_housing,
        "target_name": "Median house value (in $100k)",
    },
    "diabetes": {
        "name": "Diabetes Dataset",
        "loader": load_diabetes,
        "target_name": "Disease progression measure",
    },
    "linnerud": {
        "name": "Linnerud Dataset",
        "loader": load_linnerud,
        "target_name": "Weight/Waist/Pulse (First Target)",
    },
}


def run_regression(dataset_name="california"):
    logs = []

    def log(msg):
        logs.append(msg)

    # 1. Load dataset
    if dataset_name not in REGRESSION_DATASETS:
        dataset_name = "california"

    config = REGRESSION_DATASETS[dataset_name]
    log(f"📂 Loading {config['name']}...")
    raw_data = config["loader"]()

    # Handle multi-target datasets like Linnerud (just take first target)
    if len(raw_data.target.shape) > 1:
        target_vals = raw_data.target[:, 0]
    else:
        target_vals = raw_data.target

    df = pd.DataFrame(raw_data.data, columns=raw_data.feature_names)
    df["target"] = target_vals

    log(f"✅ Loaded {len(df):,} samples with {len(raw_data.feature_names)} features")
    log(f"📋 Features: {', '.join(raw_data.feature_names)}")
    log(f"🎯 Target: {config['target_name']}")

    # 2. Split data
    log("✂️  Splitting data into 80% train / 20% test...")
    X = df[raw_data.feature_names]
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    log(f"   Train: {len(X_train):,} samples | Test: {len(X_test):,} samples")

    # 3. Scale features
    log("⚙️  Scaling features with StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train models
    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    }

    results = []
    best_model = None
    best_r2 = -float("inf")
    best_name = ""

    for name, model in models.items():
        log(f"🏋️  Training {name}...")
        start = time.time()
        model.fit(X_train_scaled, y_train)
        train_time = time.time() - start

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        results.append({
            "model": name,
            "r2": round(r2, 4),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
            "train_time": round(train_time, 3),
        })

        log(f"   ✅ {name}: R²={r2:.4f} | RMSE={rmse:.4f} | MAE={mae:.4f} ({train_time:.3f}s)")

        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_name = name

    log(f"🏆 Best model: {best_name} (R²={best_r2:.4f})")

    # 5. Chart data — predicted vs actual for best model
    y_pred_best = best_model.predict(X_test_scaled)
    sample_idx = np.random.RandomState(42).choice(len(y_test), size=min(200, len(y_test)), replace=False)
    chart_data = [
        {"actual": round(float(y_test.iloc[i]), 3), "predicted": round(float(y_pred_best[i]), 3)}
        for i in sample_idx
    ]

    # 6. Feature importance from best model
    feature_importance = _get_feature_importance(best_model, raw_data.feature_names)

    log("📊 Training complete! Results ready.")

    # 7. EDA
    eda = _compute_eda_regression(df, raw_data.feature_names)

    return {
        "dataset": {
            "name": config["name"],
            "target_name": config["target_name"],
            "samples": len(df),
            "features": len(raw_data.feature_names),
            "description": raw_data.get("DESCR", "")[:300],
        },
        "logs": logs,
        "metrics": results,
        "best_model": best_name,
        "chart_data": chart_data,
        "feature_importance": feature_importance,
        "eda": eda,
    }


def _compute_eda_regression(df, feature_names):
    """Compute EDA stats for California Housing dataset."""
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

    # Target distribution: bucket into 10 bins
    target = df["target"]
    counts, edges = np.histogram(target, bins=10)
    target_dist = [
        {"range": f"{edges[i]:.1f}–{edges[i+1]:.1f}", "count": int(counts[i])}
        for i in range(len(counts))
    ]

    # Feature-target correlations
    correlations = [
        {"feature": col, "correlation": round(float(df[col].corr(target)), 4)}
        for col in feature_names
    ]
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {
        "feature_stats": feature_stats,
        "target_distribution": target_dist,
        "correlations": correlations,
    }


def _get_feature_importance(model, feature_names):
    try:
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
        elif hasattr(model, "coef_"):
            importances = np.abs(model.coef_).flatten()
        else:
            return []

        pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        return [{"feature": f, "importance": round(float(v), 4)} for f, v in pairs]
    except Exception:
        return []
