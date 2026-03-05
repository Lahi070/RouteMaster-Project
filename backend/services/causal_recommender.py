"""
Causal-Aware Hybrid Recommender Service
----------------------------------------
Loads the trained best_model.pkl once at import time (singleton pattern).
Provides recommend() which:
  1. Builds one feature row per Mihintale destination
  2. Runs the trained Gradient Boosting classifier (predict_proba)
  3. Applies causal adjustment (dest_cate replaces raw category score)
  4. Returns Top-N destinations sorted by causally-adjusted confidence

CSV columns expected  : name, lat, lng, formatted_address, rating,
                        extracted_activities, activity_scores
Derived automatically : category, cost_lkr, visit_duration_h, dest_cate, num_acts
"""

import ast
import logging
import pathlib
from typing import List, Dict, Any, Optional

import numpy as np
import pandas as pd
import joblib

logger = logging.getLogger(__name__)

# ── File locations ─────────────────────────────────────────────────────────────
_BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
_MODEL_PATH  = _BACKEND_DIR / "best_model.pkl"
_PLACES_CSV  = _BACKEND_DIR / "data" / "updated_mihintale_places.csv"

# Fallback: look in Reference Model next to the workspace root
if not _PLACES_CSV.exists():
    _ALT = _BACKEND_DIR.parent / "Reference Model" / "updated_mihintale_places.csv"
    if _ALT.exists():
        _PLACES_CSV = _ALT

# ── Singleton state ────────────────────────────────────────────────────────────
_payload: Optional[Dict[str, Any]] = None
_places_df: Optional[pd.DataFrame] = None


# ── CSV enrichment helpers ─────────────────────────────────────────────────────
def _derive_category(activities_str: str) -> str:
    """Derive a primary category label from the extracted_activities string."""
    if not isinstance(activities_str, str):
        return "cultural"
    acts = activities_str.lower()
    if any(k in acts for k in ("temple", "dagoba", "spiritual", "meditation",
                               "pilgrimage", "relic", "stupa")):
        return "spiritual"
    if any(k in acts for k in ("wildlife", "safari", "bird", "nature",
                               "forest", "jungle", "pokuna")):
        return "wildlife"
    if any(k in acts for k in ("hiking", "climbing", "adventure", "rock",
                               "cave", "surfing")):
        return "adventure"
    return "cultural"


def _safe_len(s: Any) -> int:
    """Count items in a list-string, e.g. \"['a', 'b']\" -> 2."""
    try:
        lst = ast.literal_eval(str(s))
        return len(lst) if isinstance(lst, list) else 1
    except Exception:
        return 1


def _enrich_places(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalise the raw CSV into the fixed schema required by recommend().
    Adapted to the actual column set:
        name, lat, lng, formatted_address, rating,
        extracted_activities, activity_scores
    """
    df = df.copy()

    # --- Derive category ---
    acts_col = df.get("extracted_activities", pd.Series([""] * len(df)))
    df["category"] = acts_col.apply(_derive_category)

    # --- Number of distinct activities ---
    df["num_acts"] = acts_col.apply(_safe_len)

    # --- Cost (most Mihintale sites share one entry ticket or are free) ---
    if "cost_lkr" not in df.columns:
        df["cost_lkr"] = 500.0        # flat ~500 LKR archeological area ticket

    # --- Visit duration ---
    if "visit_duration_h" not in df.columns:
        df["visit_duration_h"] = 1.0  # 1 hour default per stop

    # --- Causal CATE (will be 0 when not pre-computed) ---
    if "dest_cate" not in df.columns:
        df["dest_cate"] = 0.0

    # --- Average destination score ---
    if "avg_score" not in df.columns:
        df["avg_score"] = df.get("rating", pd.Series([3.5] * len(df))).fillna(3.5)

    return df


def _build_fallback_places() -> pd.DataFrame:
    """Minimal hardcoded Mihintale destinations used only if CSV is missing."""
    data = [
        {"name": "Mihintale Rock",    "lat": 8.3497, "lng": 80.5097, "rating": 4.7, "extracted_activities": "['historical monuments','temple pilgrimages']"},
        {"name": "Ambasthale Dagoba", "lat": 8.3500, "lng": 80.5095, "rating": 4.5, "extracted_activities": "['spiritual retreats','meditation']"},
        {"name": "Aradhana Gala",     "lat": 8.3510, "lng": 80.5100, "rating": 4.4, "extracted_activities": "['spiritual retreats','scenic views']"},
        {"name": "Kantaka Chetiya",   "lat": 8.3490, "lng": 80.5080, "rating": 4.3, "extracted_activities": "['historical monuments','architecture tours']"},
        {"name": "Mihintale Museum",  "lat": 8.3480, "lng": 80.5070, "rating": 4.2, "extracted_activities": "['historical monuments','arts and culture']"},
        {"name": "Kaludiya Pokuna",   "lat": 8.3520, "lng": 80.5110, "rating": 4.1, "extracted_activities": "['nature walks','wildlife viewing']"},
        {"name": "Naga Pokuna",       "lat": 8.3530, "lng": 80.5120, "rating": 4.0, "extracted_activities": "['wildlife viewing','nature walks']"},
        {"name": "Mahaseya Dagoba",   "lat": 8.3505, "lng": 80.5098, "rating": 4.6, "extracted_activities": "['temple pilgrimages','spiritual retreats']"},
        {"name": "Indikatu Seya",     "lat": 8.3470, "lng": 80.5060, "rating": 4.2, "extracted_activities": "['historical monuments','temple pilgrimages']"},
    ]
    return _enrich_places(pd.DataFrame(data))


# ── Singleton loader ───────────────────────────────────────────────────────────
def _load() -> None:
    global _payload, _places_df
    if _payload is not None:
        return

    if not _MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {_MODEL_PATH}")

    logger.info(f"Loading PKL model from {_MODEL_PATH}")
    _payload = joblib.load(str(_MODEL_PATH))
    logger.info(f"Model loaded: {_payload.get('best_model_name', 'unknown')}")

    if _PLACES_CSV.exists():
        raw_df = pd.read_csv(str(_PLACES_CSV))
        logger.info(f"Places CSV loaded: {len(raw_df)} rows, cols={list(raw_df.columns)}")
        _places_df = _enrich_places(raw_df)
    else:
        logger.warning(f"Places CSV not found at {_PLACES_CSV} — using built-in fallback data")
        _places_df = _build_fallback_places()


def get_payload() -> Dict[str, Any]:
    _load()
    return _payload  # type: ignore


def get_places_df() -> pd.DataFrame:
    _load()
    return _places_df  # type: ignore


# ── Preference / category helpers ──────────────────────────────────────────────
PREF_COLS = ["cultural", "wildlife", "spiritual", "adventure"]


def _pref_scores(preferences: List[str]) -> Dict[str, float]:
    prefs_lower = [p.lower() for p in preferences]
    return {col: 1.0 if col in prefs_lower else 0.0 for col in PREF_COLS}


def _category_flags(category: str) -> Dict[str, float]:
    cat = category.lower()
    return {
        "has_cultural":  1.0 if "cultural"  in cat else 0.0,
        "has_wildlife":  1.0 if "wildlife"  in cat else 0.0,
        "has_spiritual": 1.0 if "spiritual" in cat else 0.0,
        "has_adventure": 1.0 if "adventure" in cat else 0.0,
    }


def _act_match_score(pref_scores: Dict[str, float], cat_flags: Dict[str, float]) -> float:
    total = sum(pref_scores[p] * cat_flags[f"has_{p}"] for p in PREF_COLS)
    return min(total, 1.0)


# ── Main recommendation function ───────────────────────────────────────────────
def recommend(
    age: int,
    gender: str,
    preferences: List[str],
    budget: float,
    time_avail_h: float,
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Returns a list of up to top_n destination dicts, each containing:
        name, confidence, causal_cate, causal_score,
        lat, lng, cost_lkr, visit_duration_h, category, feature_row
    """
    _load()
    payload   = _payload
    places    = _places_df
    model     = payload["model"]
    features  = payload["features"]
    le        = payload["label_encoder"]

    # Encode gender using the trained label encoder
    try:
        gender_enc = float(le.transform([gender])[0])
    except Exception:
        gender_enc = 0.0  # 'Male' → 0 typically

    avg_pref_score = 1.0 if preferences else 0.5
    num_preferred  = float(len(preferences))
    pref_sc        = _pref_scores(preferences)

    rows: List[tuple] = []
    for _, place in places.iterrows():
        rating    = float(place.get("rating", 3.5) or 3.5)
        avg_score = float(place.get("avg_score", rating) or rating)
        num_acts  = float(place.get("num_acts", 2) or 2)
        cost      = float(place.get("cost_lkr", 500) or 500)
        duration  = float(place.get("visit_duration_h", 1.0) or 1.0)
        category  = str(place.get("category", "cultural") or "cultural")
        dest_cate = float(place.get("dest_cate", 0.0) or 0.0)

        cat_flags  = _category_flags(category)
        act_match  = _act_match_score(pref_sc, cat_flags)
        budget_ok  = 1.0 if cost <= budget else 0.0
        pref_align = avg_pref_score * min(rating / 5.0, 1.0)

        row = {
            "age":              age,
            "gender_enc":       gender_enc,
            "budget_lkr":       budget,
            "time_avail_h":     time_avail_h,
            "num_preferred":    num_preferred,
            "avg_pref_score":   avg_pref_score,
            "pref_cultural":    pref_sc["cultural"],
            "pref_wildlife":    pref_sc["wildlife"],
            "pref_spiritual":   pref_sc["spiritual"],
            "pref_adventure":   pref_sc["adventure"],
            "dest_rating":      rating,
            "dest_avg_score":   avg_score,
            "dest_num_acts":    num_acts,
            "has_cultural":     cat_flags["has_cultural"],
            "has_wildlife":     cat_flags["has_wildlife"],
            "has_spiritual":    cat_flags["has_spiritual"],
            "has_adventure":    cat_flags["has_adventure"],
            "cost_lkr":         cost,
            "visit_duration_h": duration,
            "act_match_score":  act_match,
            "budget_ok":        budget_ok,
            "pref_align":       pref_align,
            "dest_cate":        dest_cate,
        }
        rows.append((place, row))

    if not rows:
        return []

    # Build the feature matrix in the EXACT order the model was trained with
    X     = pd.DataFrame([r for _, r in rows])[features]
    proba = model.predict_proba(X)[:, 1]

    results: List[Dict[str, Any]] = []
    for i, (place, row) in enumerate(rows):
        conf        = float(proba[i])
        d_cate      = float(place.get("dest_cate", 0.0) or 0.0)
        causal_score = 0.7 * conf + 0.3 * max(0.0, d_cate)

        results.append({
            "name":             str(place.get("name", f"Place_{i}")),
            "confidence":       round(conf, 4),
            "causal_cate":      round(d_cate, 4),
            "causal_score":     round(causal_score, 4),
            "lat":              float(place["lat"]) if pd.notna(place.get("lat")) else None,
            "lng":              float(place["lng"]) if pd.notna(place.get("lng")) else None,
            "cost_lkr":         float(place.get("cost_lkr", 500) or 500),
            "visit_duration_h": float(place.get("visit_duration_h", 1.0) or 1.0),
            "category":         str(place.get("category", "cultural")),
            "feature_row":      row,      # preserved for SHAP
        })

    results.sort(key=lambda x: x["causal_score"], reverse=True)
    return results[:top_n]
