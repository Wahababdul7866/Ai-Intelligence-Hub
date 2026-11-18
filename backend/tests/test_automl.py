import pytest
from app.core.config import settings
from app.services.dataset_service import DatasetService
from app.services.automl_service import AutoMLService

def test_automl_classification():
    csv_path = settings.SAMPLES_DIR / "customer_churn.csv"
    df = DatasetService.load_dataframe(csv_path)
    
    res = AutoMLService.train_automl(df=df, target_col="churn", problem_type="classification")
    assert res.detected_problem_type == "classification"
    assert len(res.models_evaluated) >= 3
    assert res.best_model is not None
    assert res.best_model.metrics.get("accuracy", 0) > 0.65
    assert res.best_model.metrics.get("f1_score", 0) > 0.5

def test_automl_regression():
    csv_path = settings.SAMPLES_DIR / "housing_prices.csv"
    df = DatasetService.load_dataframe(csv_path)
    
    res = AutoMLService.train_automl(df=df, target_col="price_usd", problem_type="regression")
    assert res.detected_problem_type == "regression"
    assert len(res.models_evaluated) >= 3
    assert res.best_model is not None
    assert res.best_model.metrics.get("r2", 0) > 0.5
    assert res.best_model.metrics.get("rmse", 0) > 0

def test_automl_clustering():
    csv_path = settings.SAMPLES_DIR / "customer_segmentation.csv"
    df = DatasetService.load_dataframe(csv_path)
    
    res = AutoMLService.train_automl(df=df, target_col=None, problem_type="clustering")
    assert res.detected_problem_type == "clustering"
    assert len(res.models_evaluated) >= 1
    assert res.best_model is not None
    assert "silhouette_score" in res.best_model.metrics

def test_automl_anomaly_detection():
    csv_path = settings.SAMPLES_DIR / "transaction_fraud.csv"
    df = DatasetService.load_dataframe(csv_path)
    
    res = AutoMLService.train_automl(df=df, target_col=None, problem_type="anomaly")
    assert res.detected_problem_type == "anomaly"
    assert len(res.models_evaluated) >= 1
    assert "anomalies_detected" in res.best_model.metrics
