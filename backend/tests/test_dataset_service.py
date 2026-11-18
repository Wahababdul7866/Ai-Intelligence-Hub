import pytest
from pathlib import Path
from app.core.config import settings
from app.services.dataset_service import DatasetService

def test_load_and_profile_churn():
    csv_path = settings.SAMPLES_DIR / "customer_churn.csv"
    assert csv_path.exists(), "Sample churn dataset must exist"
    
    df = DatasetService.load_dataframe(csv_path)
    assert len(df) == 1000
    assert "churn" in df.columns
    assert "monthly_charges" in df.columns

    profile = DatasetService.profile_dataset(df, dataset_id="test-1", name="Test Churn")
    assert profile.row_count == 1000
    assert profile.column_count >= 8
    assert len(profile.columns) == profile.column_count
    
    # Check numeric stats
    mc_col = next(c for c in profile.columns if c.name == "monthly_charges")
    assert mc_col.is_numeric is True
    assert mc_col.mean is not None and mc_col.mean > 0
    assert mc_col.min is not None and mc_col.max is not None

    # Check suggested target
    assert "churn" in profile.suggested_target_columns

def test_load_and_profile_housing():
    csv_path = settings.SAMPLES_DIR / "housing_prices.csv"
    assert csv_path.exists()
    
    df = DatasetService.load_dataframe(csv_path)
    profile = DatasetService.profile_dataset(df, dataset_id="test-2", name="Housing")
    assert profile.row_count == 800
    assert profile.correlation_matrix is not None
    assert "price_usd" in profile.suggested_target_columns
