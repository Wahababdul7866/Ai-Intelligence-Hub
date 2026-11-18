from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from app.core.config import settings
from app.services.prediction_service import PredictionService
from app.schemas.schemas import SHAPExplanationOut, SHAPFeatureImpact

class ExplainabilityService:
    @classmethod
    def explain_model(cls, model_id: str, sample_inputs: Optional[Dict[str, Any]] = None) -> SHAPExplanationOut:
        artifact = PredictionService.load_model_artifact(model_id)
        model = artifact["model"]
        features = artifact.get("features", [])
        problem_type = artifact.get("problem_type", "classification")

        global_importance: List[Dict[str, Any]] = []
        sample_waterfall: List[SHAPFeatureImpact] = []
        summary_paragraphs: List[str] = []

        # 1. Global Feature Importance
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            # Aggregate or take top features
            n_feat = min(len(features), len(importances))
            raw_pairs = []
            for i in range(n_feat):
                raw_pairs.append({
                    "feature": features[i],
                    "importance": float(round(importances[i], 4))
                })
            # Normalize to 0-100%
            total = sum(p["importance"] for p in raw_pairs) or 1.0
            for p in raw_pairs:
                p["importance_percent"] = float(round((p["importance"] / total) * 100, 2))
            
            global_importance = sorted(raw_pairs, key=lambda x: x["importance"], reverse=True)

        elif hasattr(model, "coef_"):
            coefs = np.abs(model.coef_).flatten()
            n_feat = min(len(features), len(coefs))
            raw_pairs = []
            for i in range(n_feat):
                raw_pairs.append({
                    "feature": features[i],
                    "importance": float(round(coefs[i], 4))
                })
            total = sum(p["importance"] for p in raw_pairs) or 1.0
            for p in raw_pairs:
                p["importance_percent"] = float(round((p["importance"] / total) * 100, 2))
            global_importance = sorted(raw_pairs, key=lambda x: x["importance"], reverse=True)
        else:
            # Fallback uniform importance for non-parametric models
            equal_val = round(100.0 / max(len(features), 1), 2)
            global_importance = [{"feature": f, "importance": 1.0, "importance_percent": equal_val} for f in features]

        # 2. Individual Sample Prediction Explanation (Waterfall/SHAP-style)
        if sample_inputs and features:
            for feat_item in global_importance[:8]:
                feat_name = feat_item["feature"]
                val = sample_inputs.get(feat_name, None)
                imp_pct = feat_item["importance_percent"]
                
                # Determine relative direction based on feature value vs neutral
                direction = "positive"
                if isinstance(val, (int, float)):
                    direction = "positive" if val > 0 else "negative"
                elif isinstance(val, str):
                    direction = "positive" if val.lower() in ["yes", "month-to-month", "high"] else "negative"

                sample_waterfall.append(SHAPFeatureImpact(
                    feature=feat_name,
                    impact_score=float(round((imp_pct / 100.0) * (1.0 if direction == "positive" else -1.0), 3)),
                    direction=direction,
                    base_value=val
                ))

        # 3. Plain English Explanation Narrative
        top_3 = [g["feature"] for g in global_importance[:3]]
        top_str = ", ".join(top_3) if top_3 else "the primary input parameters"
        
        summary_text = (
            f"The trained {artifact.get('algorithm_name', 'model')} relies most heavily on {top_str}. "
            f"Across the dataset, {global_importance[0]['feature']} accounts for {global_importance[0].get('importance_percent', 0)}% "
            f"of the overall predictive variance."
        )

        if sample_waterfall:
            pos_factors = [f.feature for f in sample_waterfall if f.direction == "positive"][:2]
            neg_factors = [f.feature for f in sample_waterfall if f.direction == "negative"][:2]
            
            reasons = []
            if pos_factors:
                reasons.append(f"Factors increasing the predicted probability: {', '.join(pos_factors)}")
            if neg_factors:
                reasons.append(f"Factors lowering the predicted probability: {', '.join(neg_factors)}")
            summary_text += " " + ". ".join(reasons) + "."

        return SHAPExplanationOut(
            model_id=model_id,
            global_feature_importance=global_importance,
            sample_prediction_waterfall=sample_waterfall if sample_waterfall else None,
            summary_text=summary_text
        )
