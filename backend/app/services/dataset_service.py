import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
from app.schemas.schemas import ColumnSummary, DatasetProfileResponse

class DatasetService:
    @staticmethod
    def load_dataframe(file_path: str | Path) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = path.suffix.lower()
        if ext in [".csv", ".txt"]:
            # Try utf-8 then latin1
            try:
                return pd.read_csv(file_path, encoding="utf-8")
            except UnicodeDecodeError:
                return pd.read_csv(file_path, encoding="latin1")
        elif ext in [".xlsx", ".xls"]:
            return pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}. Allowed: .csv, .xlsx, .xls")

    @classmethod
    def profile_dataset(cls, df: pd.DataFrame, dataset_id: str = "", name: str = "") -> DatasetProfileResponse:
        row_count, col_count = df.shape
        duplicate_rows = int(df.duplicated().sum())
        total_missing = int(df.isna().sum().sum())
        
        columns_summary: List[ColumnSummary] = []
        numeric_cols: List[str] = []
        
        for col in df.columns:
            series = df[col]
            dtype_str = str(series.dtype)
            null_count = int(series.isna().sum())
            null_pct = float(round((null_count / max(row_count, 1)) * 100, 2))
            unique_count = int(series.nunique(dropna=True))
            
            is_numeric = pd.api.types.is_numeric_dtype(series)
            is_categorical = pd.api.types.is_object_dtype(series) or isinstance(series.dtype, pd.CategoricalDtype) or (unique_count < 10 and not is_numeric)
            is_datetime = pd.api.types.is_datetime64_any_dtype(series)
            
            summary = ColumnSummary(
                name=str(col),
                dtype=dtype_str,
                null_count=null_count,
                null_percentage=null_pct,
                unique_count=unique_count,
                is_numeric=is_numeric,
                is_categorical=is_categorical,
                is_datetime=is_datetime,
                sample_values=series.dropna().head(5).tolist()
            )
            
            if is_numeric:
                numeric_cols.append(col)
                valid_num = series.dropna()
                if len(valid_num) > 0:
                    q1 = float(valid_num.quantile(0.25))
                    q3 = float(valid_num.quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers = int(((valid_num < lower_bound) | (valid_num > upper_bound)).sum())
                    
                    summary.min = float(valid_num.min())
                    summary.max = float(valid_num.max())
                    summary.mean = float(round(valid_num.mean(), 4))
                    summary.std = float(round(valid_num.std(), 4)) if len(valid_num) > 1 else 0.0
                    summary.median = float(round(valid_num.median(), 4))
                    summary.outliers_count = outliers
            
            if is_categorical:
                top_counts = series.value_counts().head(6).to_dict()
                summary.top_categories = {str(k): int(v) for k, v in top_counts.items()}
            
            columns_summary.append(summary)
            
        # Correlation Matrix for numerical columns
        corr_dict = None
        if len(numeric_cols) >= 2:
            try:
                corr_df = df[numeric_cols].corr(method="pearson").round(3)
                corr_dict = {str(row): {str(col): float(val) if not np.isnan(val) else 0.0 for col, val in corr_df[row].items()} for row in corr_df.index}
            except Exception:
                corr_dict = None
        
        # Suggested targets
        suggested_targets = []
        common_target_names = ["churn", "target", "label", "price", "fraud", "is_fraud", "status", "class", "outcome", "survived", "salary"]
        for col in df.columns:
            col_lower = str(col).lower()
            if any(name in col_lower for name in common_target_names):
                suggested_targets.append(str(col))
        
        # If no common names matched, suggest columns with reasonable cardinality
        if not suggested_targets:
            for col in df.columns:
                if 2 <= df[col].nunique() <= 20:
                    suggested_targets.append(str(col))
                    if len(suggested_targets) >= 3:
                        break
        
        # Preview records
        preview_records = df.head(10).replace({np.nan: None}).to_dict(orient="records")
        
        return DatasetProfileResponse(
            dataset_id=dataset_id,
            name=name,
            row_count=row_count,
            column_count=col_count,
            duplicate_rows=duplicate_rows,
            total_missing_values=total_missing,
            columns=columns_summary,
            correlation_matrix=corr_dict,
            suggested_target_columns=suggested_targets,
            preview_data=preview_records
        )
