import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_absolute_error, mean_squared_error, r2_score, silhouette_score
)

# Classification Models
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    RandomForestRegressor, GradientBoostingRegressor,
    IsolationForest
)
from sklearn.cluster import KMeans, DBSCAN

# Try XGBoost if available
try:
    from xgboost import XGBClassifier, XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

from app.core.config import settings
from app.schemas.schemas import ModelComparisonItem, AutoMLTrainResponse

class AutoMLService:
    @staticmethod
    def detect_problem_type(df: pd.DataFrame, target_col: Optional[str]) -> Tuple[str, Optional[str]]:
        if not target_col or target_col not in df.columns:
            # Check for candidate target columns
            common_targets = ["churn", "target", "label", "price", "fraud", "is_fraud", "status"]
            for col in df.columns:
                if any(k in str(col).lower() for k in common_targets):
                    target_col = col
                    break
        
        if not target_col or target_col not in df.columns:
            return "clustering", None
        
        series = df[target_col].dropna()
        n_unique = series.nunique()
        is_num = pd.api.types.is_numeric_dtype(series)
        
        if not is_num or n_unique <= 10:
            return "classification", target_col
        else:
            return "regression", target_col

    @classmethod
    def train_automl(
        cls,
        df: pd.DataFrame,
        target_col: Optional[str] = None,
        problem_type: Optional[str] = None,
        test_size: float = 0.2
    ) -> AutoMLTrainResponse:
        experiment_id = str(uuid.uuid4())
        
        # Determine problem type and target
        detected_type, target = cls.detect_problem_type(df, target_col)
        actual_type = problem_type if problem_type and problem_type != "auto" else detected_type
        
        # Prepare Features
        drop_cols = []
        if target:
            drop_cols.append(target)
        
        # Drop ID-like columns (very high cardinality string columns)
        for c in df.columns:
            if c != target and (str(c).lower().endswith("id") or str(c).lower().startswith("id_")):
                drop_cols.append(c)
            elif c != target and df[c].dtype == object and df[c].nunique() > 0.8 * len(df):
                drop_cols.append(c)
        
        feature_cols = [c for c in df.columns if c not in drop_cols]
        if not feature_cols:
            raise ValueError("No valid feature columns found for training after filtering.")

        X = df[feature_cols].copy()
        y = df[target].copy() if target else None

        # Build Preprocessing Pipeline
        num_cols = [c for c in feature_cols if pd.api.types.is_numeric_dtype(X[c])]
        cat_cols = [c for c in feature_cols if c not in num_cols]

        transformers = []
        if num_cols:
            num_pipe = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler())
            ])
            transformers.append(('num', num_pipe, num_cols))
        
        if cat_cols:
            cat_pipe = Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])
            transformers.append(('cat', cat_pipe, cat_cols))

        preprocessor = ColumnTransformer(transformers=transformers, remainder='drop')
        
        # Route to problem type trainer
        if actual_type == "classification":
            return cls._train_classification(experiment_id, X, y, preprocessor, feature_cols, target, test_size)
        elif actual_type == "regression":
            return cls._train_regression(experiment_id, X, y, preprocessor, feature_cols, target, test_size)
        elif actual_type == "anomaly":
            return cls._train_anomaly(experiment_id, X, preprocessor, feature_cols)
        else:
            return cls._train_clustering(experiment_id, X, preprocessor, feature_cols)

    @classmethod
    def _train_classification(
        cls, experiment_id: str, X: pd.DataFrame, y: pd.Series,
        preprocessor: ColumnTransformer, feature_cols: List[str], target: str, test_size: float
    ) -> AutoMLTrainResponse:
        # Check class balance
        y_clean = y.dropna()
        valid_idx = y_clean.index
        X_clean = X.loc[valid_idx]
        
        # Encode target if categorical
        classes = np.unique(y_clean)
        is_binary = len(classes) == 2
        label_map = None
        if not pd.api.types.is_numeric_dtype(y_clean):
            label_map = {val: idx for idx, val in enumerate(classes)}
            y_encoded = y_clean.map(label_map).values
        else:
            y_encoded = y_clean.values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_clean, y_encoded, test_size=test_size, random_state=42,
            stratify=y_encoded if min(np.bincount(y_encoded.astype(int))) >= 2 else None
        )
        
        # Fit preprocessor
        X_train_proc = preprocessor.fit_transform(X_train)
        X_test_proc = preprocessor.transform(X_test)
        
        # Algorithms candidates
        candidate_models = [
            ("Random Forest", RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)),
            ("Gradient Boosting", GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)),
            ("Logistic Regression", LogisticRegression(max_iter=500, random_state=42)),
            ("Decision Tree", DecisionTreeClassifier(max_depth=6, random_state=42))
        ]
        if HAS_XGBOOST:
            candidate_models.insert(1, ("XGBoost", XGBClassifier(n_estimators=100, max_depth=4, random_state=42, eval_metric='logloss')))

        evaluated_models: List[ModelComparisonItem] = []
        best_score = -1.0
        best_model_item = None
        best_pipe = None

        for name, clf in candidate_models:
            start_t = time.time()
            try:
                clf.fit(X_train_proc, y_train)
                duration = round(time.time() - start_t, 3)
                
                y_pred = clf.predict(X_test_proc)
                acc = float(accuracy_score(y_test, y_pred))
                prec = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                rec = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                f1 = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
                
                # CV Score
                try:
                    cv_scores = cross_val_score(clf, X_train_proc, y_train, cv=min(5, len(X_train)))
                    cv_mean = float(np.mean(cv_scores))
                except Exception:
                    cv_mean = acc
                
                # ROC-AUC if possible
                roc_auc = None
                if hasattr(clf, "predict_proba"):
                    try:
                        probs = clf.predict_proba(X_test_proc)
                        if is_binary:
                            roc_auc = float(roc_auc_score(y_test, probs[:, 1]))
                        else:
                            roc_auc = float(roc_auc_score(y_test, probs, multi_class='ovr'))
                    except Exception:
                        roc_auc = None

                metrics = {
                    "accuracy": round(acc, 4),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1_score": round(f1, 4),
                    "cv_score": round(cv_mean, 4)
                }
                if roc_auc is not None:
                    metrics["roc_auc"] = round(roc_auc, 4)

                model_id = str(uuid.uuid4())
                
                # Full pipeline for persistence
                full_pipeline = Pipeline([
                    ('preprocessor', preprocessor),
                    ('classifier', clf)
                ])
                
                # Save artifact
                artifact_file = settings.MODEL_DIR / f"{model_id}.joblib"
                joblib.dump({
                    "pipeline": full_pipeline,
                    "model": clf,
                    "preprocessor": preprocessor,
                    "problem_type": "classification",
                    "algorithm_name": name,
                    "features": feature_cols,
                    "target": target,
                    "classes": classes.tolist(),
                    "label_map": label_map,
                    "metrics": metrics
                }, artifact_file)

                item = ModelComparisonItem(
                    model_id=model_id,
                    name=f"{name} Classifier",
                    algorithm_name=name,
                    problem_type="classification",
                    training_duration_sec=duration,
                    metrics=metrics,
                    is_best=False,
                    created_at=datetime.now(timezone.utc)
                )
                evaluated_models.append(item)

                if f1 > best_score:
                    best_score = f1
                    best_model_item = item
            except Exception as e:
                print(f"Error training {name}: {e}")
                continue

        if best_model_item:
            best_model_item.is_best = True

        return AutoMLTrainResponse(
            experiment_id=experiment_id,
            dataset_id="",
            detected_problem_type="classification",
            target_column=target,
            features_used=feature_cols,
            models_evaluated=evaluated_models,
            best_model=best_model_item or evaluated_models[0]
        )

    @classmethod
    def _train_regression(
        cls, experiment_id: str, X: pd.DataFrame, y: pd.Series,
        preprocessor: ColumnTransformer, feature_cols: List[str], target: str, test_size: float
    ) -> AutoMLTrainResponse:
        y_clean = y.dropna()
        valid_idx = y_clean.index
        X_clean = X.loc[valid_idx]
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_clean, y_clean.values, test_size=test_size, random_state=42
        )
        
        X_train_proc = preprocessor.fit_transform(X_train)
        X_test_proc = preprocessor.transform(X_test)

        candidate_models = [
            ("Random Forest Regressor", RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42)),
            ("Gradient Boosting", GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)),
            ("Ridge Regression", Ridge(alpha=1.0)),
            ("Linear Regression", LinearRegression())
        ]
        if HAS_XGBOOST:
            candidate_models.insert(1, ("XGBoost Regressor", XGBRegressor(n_estimators=100, max_depth=4, random_state=42)))

        evaluated_models: List[ModelComparisonItem] = []
        best_score = -999999.0
        best_model_item = None

        for name, reg in candidate_models:
            start_t = time.time()
            try:
                reg.fit(X_train_proc, y_train)
                duration = round(time.time() - start_t, 3)
                
                y_pred = reg.predict(X_test_proc)
                mae = float(mean_absolute_error(y_test, y_pred))
                mse = float(mean_squared_error(y_test, y_pred))
                rmse = float(np.sqrt(mse))
                r2 = float(r2_score(y_test, y_pred))
                
                # CV Score
                try:
                    cv_scores = cross_val_score(reg, X_train_proc, y_train, cv=min(5, len(X_train)), scoring='r2')
                    cv_mean = float(np.mean(cv_scores))
                except Exception:
                    cv_mean = r2

                metrics = {
                    "mae": round(mae, 4),
                    "mse": round(mse, 4),
                    "rmse": round(rmse, 4),
                    "r2": round(r2, 4),
                    "cv_score": round(cv_mean, 4)
                }

                model_id = str(uuid.uuid4())
                full_pipeline = Pipeline([
                    ('preprocessor', preprocessor),
                    ('regressor', reg)
                ])

                artifact_file = settings.MODEL_DIR / f"{model_id}.joblib"
                joblib.dump({
                    "pipeline": full_pipeline,
                    "model": reg,
                    "preprocessor": preprocessor,
                    "problem_type": "regression",
                    "algorithm_name": name,
                    "features": feature_cols,
                    "target": target,
                    "metrics": metrics
                }, artifact_file)

                item = ModelComparisonItem(
                    model_id=model_id,
                    name=f"{name}",
                    algorithm_name=name,
                    problem_type="regression",
                    training_duration_sec=duration,
                    metrics=metrics,
                    is_best=False,
                    created_at=datetime.now(timezone.utc)
                )
                evaluated_models.append(item)

                if r2 > best_score:
                    best_score = r2
                    best_model_item = item
            except Exception as e:
                print(f"Error training {name}: {e}")
                continue

        if best_model_item:
            best_model_item.is_best = True

        return AutoMLTrainResponse(
            experiment_id=experiment_id,
            dataset_id="",
            detected_problem_type="regression",
            target_column=target,
            features_used=feature_cols,
            models_evaluated=evaluated_models,
            best_model=best_model_item or evaluated_models[0]
        )

    @classmethod
    def _train_clustering(
        cls, experiment_id: str, X: pd.DataFrame,
        preprocessor: ColumnTransformer, feature_cols: List[str]
    ) -> AutoMLTrainResponse:
        X_proc = preprocessor.fit_transform(X)
        evaluated_models = []
        best_score = -1.0
        best_item = None

        for k in [3, 4, 5]:
            start_t = time.time()
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X_proc)
            duration = round(time.time() - start_t, 3)
            
            sil = float(silhouette_score(X_proc, labels)) if len(np.unique(labels)) > 1 else 0.0
            metrics = {
                "clusters": k,
                "silhouette_score": round(sil, 4),
                "inertia": round(float(kmeans.inertia_), 2)
            }
            
            model_id = str(uuid.uuid4())
            artifact_file = settings.MODEL_DIR / f"{model_id}.joblib"
            joblib.dump({
                "model": kmeans,
                "preprocessor": preprocessor,
                "problem_type": "clustering",
                "algorithm_name": f"K-Means (k={k})",
                "features": feature_cols,
                "metrics": metrics
            }, artifact_file)

            item = ModelComparisonItem(
                model_id=model_id,
                name=f"K-Means ({k} Clusters)",
                algorithm_name="K-Means",
                problem_type="clustering",
                training_duration_sec=duration,
                metrics=metrics,
                is_best=False,
                created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            )
            evaluated_models.append(item)
            if sil > best_score:
                best_score = sil
                best_item = item

        if best_item:
            best_item.is_best = True

        return AutoMLTrainResponse(
            experiment_id=experiment_id,
            dataset_id="",
            detected_problem_type="clustering",
            target_column=None,
            features_used=feature_cols,
            models_evaluated=evaluated_models,
            best_model=best_item or evaluated_models[0]
        )

    @classmethod
    def _train_anomaly(
        cls, experiment_id: str, X: pd.DataFrame,
        preprocessor: ColumnTransformer, feature_cols: List[str]
    ) -> AutoMLTrainResponse:
        X_proc = preprocessor.fit_transform(X)
        start_t = time.time()
        
        iso = IsolationForest(contamination=0.05, random_state=42)
        preds = iso.fit_predict(X_proc)
        duration = round(time.time() - start_t, 3)
        
        anomalies_detected = int((preds == -1).sum())
        metrics = {
            "anomalies_detected": anomalies_detected,
            "anomaly_rate": round(float(anomalies_detected / len(X)), 4)
        }
        
        model_id = str(uuid.uuid4())
        artifact_file = settings.MODEL_DIR / f"{model_id}.joblib"
        joblib.dump({
            "model": iso,
            "preprocessor": preprocessor,
            "problem_type": "anomaly",
            "algorithm_name": "Isolation Forest",
            "features": feature_cols,
            "metrics": metrics
        }, artifact_file)

        item = ModelComparisonItem(
            model_id=model_id,
            name="Isolation Forest Anomaly Detector",
            algorithm_name="Isolation Forest",
            problem_type="anomaly",
            training_duration_sec=duration,
            metrics=metrics,
            is_best=True,
            created_at=time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        )

        return AutoMLTrainResponse(
            experiment_id=experiment_id,
            dataset_id="",
            detected_problem_type="anomaly",
            target_column=None,
            features_used=feature_cols,
            models_evaluated=[item],
            best_model=item
        )
