import os
from typing import Dict, Any, List, Optional
from pathlib import Path
from app.core.config import settings

try:
    import mlflow
    HAS_MLFLOW = True
except ImportError:
    HAS_MLFLOW = False

class MLflowService:
    @classmethod
    def init_mlflow(cls):
        if HAS_MLFLOW:
            try:
                mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            except Exception as e:
                print(f"Failed to set MLflow tracking URI: {e}")

    @classmethod
    def log_experiment_run(
        cls,
        experiment_name: str,
        run_name: str,
        params: Dict[str, Any],
        metrics: Dict[str, float],
        tags: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        if not HAS_MLFLOW:
            return None
        
        try:
            cls.init_mlflow()
            mlflow.set_experiment(experiment_name)
            with mlflow.start_run(run_name=run_name) as run:
                if tags:
                    mlflow.set_tags(tags)
                for k, v in params.items():
                    mlflow.log_param(k, str(v)[:250])
                for k, v in metrics.items():
                    if isinstance(v, (int, float)):
                        mlflow.log_metric(k, float(v))
                return run.info.run_id
        except Exception as e:
            print(f"MLflow logging error: {e}")
            return None

    @classmethod
    def list_experiments(cls) -> List[Dict[str, Any]]:
        if not HAS_MLFLOW:
            return []
        try:
            cls.init_mlflow()
            experiments = mlflow.search_experiments()
            results = []
            for exp in experiments:
                results.append({
                    "experiment_id": exp.experiment_id,
                    "name": exp.name,
                    "artifact_location": exp.artifact_location,
                    "lifecycle_stage": exp.lifecycle_stage
                })
            return results
        except Exception as e:
            print(f"Error fetching MLflow experiments: {e}")
            return []
