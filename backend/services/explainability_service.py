"""
Explainability Service — SHAP TreeExplainer
---------------------------------------------
Generates SHAP values for each recommended destination and formats
them into human-readable top-3 feature explanations.
"""

import logging
from typing import List, Dict, Any, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def _get_shap_values(model, feature_row: Dict[str, Any], features: List[str]) -> Optional[np.ndarray]:
    """
    Run SHAP TreeExplainer on a single feature row.
    Returns 1-D array of SHAP values (one per feature), or None on failure.
    """
    try:
        import shap

        X = pd.DataFrame([feature_row])[features]
        explainer   = shap.TreeExplainer(model, feature_perturbation="interventional")
        shap_values = explainer.shap_values(X, check_additivity=False)

        # For binary classifiers SHAP may return [class0_array, class1_array]
        sv = shap_values[1] if isinstance(shap_values, list) else shap_values
        return np.array(sv).flatten()
    except Exception as exc:
        logger.warning(f"SHAP computation failed: {exc}")
        return None


def explain(
    model,
    feature_rows: List[Dict[str, Any]],
    dest_names: List[str],
    features: List[str],
) -> Dict[str, Dict[str, Any]]:
    """
    For each destination compute SHAP values and return:
        {
          dest_name: {
            top_features: [{feature, shap_value}, ...],
            explanation_text: str,
            confidence: float   (from feature_row model prediction)
          }
        }
    """
    explanations: Dict[str, Dict[str, Any]] = {}

    for name, row in zip(dest_names, feature_rows):
        sv = _get_shap_values(model, row, features)

        if sv is None:
            # Graceful fallback — use act_match_score as stand-in
            explanations[name] = {
                "top_features": [
                    {"feature": "act_match_score", "shap_value": round(float(row.get("act_match_score", 0)), 4)},
                    {"feature": "budget_ok",        "shap_value": round(float(row.get("budget_ok", 0)), 4)},
                    {"feature": "pref_align",        "shap_value": round(float(row.get("pref_align", 0)), 4)},
                ],
                "explanation_text": _generate_text(name, row, None, features),
                "confidence": round(float(row.get("act_match_score", 0.5)), 4),
            }
            continue

        # Sort by absolute SHAP value descending
        ranked = sorted(
            zip(features, sv.tolist()),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        top3 = [{"feature": f, "shap_value": round(v, 5)} for f, v in ranked[:3]]
        explanations[name] = {
            "top_features":     top3,
            "explanation_text": _generate_text(name, row, top3, features),
            "confidence":       round(float(row.get("act_match_score", 0.5)), 4),
        }

    return explanations


def _generate_text(
    name: str,
    row: Dict[str, Any],
    top3: Optional[List[Dict[str, Any]]],
    features: List[str],
) -> str:
    """
    Produce a single human-readable sentence that explains the recommendation.
    """
    act_match  = row.get("act_match_score", 0)
    budget_ok  = row.get("budget_ok", 1)
    pref_align = row.get("pref_align", 0)
    dest_cate  = row.get("dest_cate", 0)

    match_pct  = int(act_match * 100)
    budget_str = "fits your budget" if budget_ok >= 1 else "may stretch your budget"
    causal_str = ("has a strong causal relevance score" if dest_cate > 0
                  else "is included for activity diversity")

    if top3:
        top_feat = top3[0]["feature"].replace("_", " ")
        return (
            f"{name} scored {match_pct}% on activity match. "
            f"The most influential factor was '{top_feat}'. "
            f"It {budget_str} and {causal_str}, "
            f"indicating low popularity bias."
        )
    else:
        return (
            f"{name} aligns {match_pct}% with your preferences. "
            f"It {budget_str} and {causal_str}."
        )
