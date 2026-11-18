import pytest
import ast
import pandas as pd
from app.core.config import settings
from app.services.dataset_service import DatasetService
from app.services.analyst_service import AnalystService, SafeAstValidator

def test_safe_analyst_computations():
    csv_path = settings.SAMPLES_DIR / "customer_churn.csv"
    df = DatasetService.load_dataframe(csv_path)

    # 1. Average query
    res, op, intent, cfg, data = AnalystService.execute_safe_query(df, "What is the average monthly charges?")
    assert isinstance(res, (int, float))
    assert res > 20 and res < 120
    assert "mean" in op

    # 2. Groupby average query
    res, op, intent, cfg, data = AnalystService.execute_safe_query(df, "What is the average monthly charges by contract?")
    assert isinstance(res, list)
    assert len(res) > 0
    assert cfg is not None
    assert cfg.chart_type == "bar"

    # 3. Maximum / Top query
    res, op, intent, cfg, data = AnalystService.execute_safe_query(df, "What is the highest monthly charges?")
    assert isinstance(res, (int, float))
    assert res > 50

def test_safe_ast_validator_blocks_malicious_code():
    malicious_code = "__import__('os').system('rm -rf /')"
    tree = ast.parse(malicious_code)
    validator = SafeAstValidator()
    validator.visit(tree)
    assert validator.is_safe is False

    malicious_import = "import subprocess; subprocess.Popen(['calc'])"
    tree2 = ast.parse(malicious_import)
    validator2 = SafeAstValidator()
    validator2.visit(tree2)
    assert validator2.is_safe is False
