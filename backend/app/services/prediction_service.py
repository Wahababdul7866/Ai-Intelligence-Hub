from pathlib import Path
from typing import Dict, Any, List, Optional
import joblib
import numpy as np
import pandas as pd
from app.core.config import settings
from app.schemas.schemas import PredictionResponse

class PredictionService:
    @staticmethod
    def load_model_artifact(model_id: str) -> Dict[str, Any]:
        artifact_path = settings.MODEL_DIR / f"{model_id}.joblib"
        if not artifact_path.exists():
            raise FileNotFoundError(f"Model artifact not found for id: {model_id}")
        return joblib.load(artifact_path)

    @classmethod
    def predict_single(cls, model_id: str, input_dict: Dict[str, Any]) -> PredictionResponse:
        artifact = cls.load_model_artifact(model_id)
        model = artifact["model"]
        preprocessor = artifact.get("preprocessor")
        problem_type = artifact.get("problem_type", "classification")
        algorithm_name = artifact.get("algorithm_name", "Unknown")
        features = artifact.get("features", [])
        
        # Construct single-row DataFrame aligned with training features
        row_data = {}
        for feat in features:
            val = input_dict.get(feat, None)
            row_data[feat] = [val]
        df_input = pd.DataFrame(row_data)

        # Transform features
        if preprocessor is not None:
            X_proc = preprocessor.transform(df_input)
        else:
            X_proc = df_input.values

        # Generate Prediction
        raw_pred = model.predict(X_proc)
        pred_val = raw_pred[0]
        
        probability = None
        class_probs = None
        pred_label = str(pred_val)
        explanation = None

        if problem_type == "classification":
            classes = artifact.get("classes", [])
            label_map = artifact.get("label_map")
            
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(X_proc)[0]
                max_prob = float(np.max(probs))
                probability = round(max_prob, 4)
                
                # Format class probabilities
                if classes is not None and len(classes) == len(probs):
                    class_probs = {str(classes[i]): round(float(probs[i]), 4) for i in range(len(probs))}
                else:
                    class_probs = {f"Class {i}": round(float(probs[i]), 4) for i in range(len(probs))}
            
            if label_map:
                inv_map = {v: k for k, v in label_map.items()}
                pred_label = str(inv_map.get(pred_val, pred_val))
            elif classes is not None and int(pred_val) < len(classes):
                pred_label = str(classes[int(pred_val)])
                
            explanation = f"Model predicts {pred_label} with {round((probability or 1.0) * 100, 1)}% model confidence."

        elif problem_type == "regression":
            pred_val = float(round(pred_val, 2))
            pred_label = f"{pred_val:,.2f}"
            explanation = f"Estimated target value is {pred_label} based on input attributes."

        elif problem_type == "clustering":
            pred_val = int(pred_val)
            pred_label = f"Cluster {pred_val}"
            explanation = f"Record assigned to Cluster {pred_val} based on proximity to learned centroids."

        elif problem_type == "anomaly":
            is_anomaly = bool(pred_val == -1)
            pred_label = "Anomaly" if is_anomaly else "Normal"
            explanation = (
                "Record flagged as an unusual data outlier (Anomaly)." 
                if is_anomaly else 
                "Record matches normal expected behavior patterns."
            )

        return PredictionResponse(
            model_id=model_id,
            algorithm_name=algorithm_name,
            prediction=pred_val if not isinstance(pred_val, (np.generic,)) else pred_val.item(),
            prediction_label=pred_label,
            probability=probability,
            class_probabilities=class_probs,
            explanation=explanation,
            feature_contributions=None
        )

    @classmethod
    def predict_batch(cls, model_id: str, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        artifact = cls.load_model_artifact(model_id)
        model = artifact["model"]
        preprocessor = artifact.get("preprocessor")
        features = artifact.get("features", [])
        
        df_input = pd.DataFrame(data)
        # Ensure all columns exist
        for col in features:
            if col not in df_input.columns:
                df_input[col] = np.nan
        df_input = df_input[features]

        X_proc = preprocessor.transform(df_input) if preprocessor else df_input.values
        preds = model.predict(X_proc)

        results = []
        for i, pred in enumerate(preds):
            results.append({
                "row_index": i,
                "prediction": pred.item() if hasattr(pred, "item") else pred
            })
        return results
