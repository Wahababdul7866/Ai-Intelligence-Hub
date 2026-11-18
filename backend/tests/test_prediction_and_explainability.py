import pytest
from app.core.config import settings
from app.services.dataset_service import DatasetService
from app.services.automl_service import AutoMLService
from app.services.prediction_service import PredictionService
from app.services.explainability_service import ExplainabilityService

def test_prediction_and_shap_flow():
    csv_path = settings.SAMPLES_DIR / "customer_churn.csv"
    df = DatasetService.load_dataframe(csv_path)
    
    # Train
    train_res = AutoMLService.train_automl(df=df, target_col="churn", problem_type="classification")
    best_id = train_res.best_model.model_id
    
    # Predict Single
    sample_input = {
        "tenure_months": 2,
        "monthly_charges": 110.5,
        "total_charges": 221.0,
        "contract": "Month-to-month",
        "internet_service": "Fiber optic",
        "tech_support": "No",
        "paperless_billing": "Yes",
        "payment_method": "Electronic check"
    }
    pred_res = PredictionService.predict_single(best_id, sample_input)
    assert pred_res.model_id == best_id
    assert pred_res.prediction_label is not None
    assert pred_res.probability is not None
    assert pred_res.explanation is not None

    # Explain with SHAP
    shap_res = ExplainabilityService.explain_model(best_id, sample_input)
    assert shap_res.model_id == best_id
    assert len(shap_res.global_feature_importance) > 0
    assert "disclaimer" in shap_res.disclaimer.lower() or "notice" in shap_res.disclaimer.lower()
    assert shap_res.summary_text is not None
