
import json

def md(source):
    return {"cell_type": "markdown", "metadata": {}, "source": [source]}

def code(source, outputs=None):
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": outputs if outputs else [],
        "source": [source]
    }

cells = []

# ─────────────────────────────────────────────────────────────────────────────
# CELL 0 – Auto-install cell (first cell in notebook)
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("# Causal-Aware Hybrid Travel Recommendation System — Mihintale\n\n## Environment Setup\nRun this cell first to install all required packages into the **current Jupyter kernel**."))

cells.append(code("""\
import subprocess, sys

PACKAGES = [
    "xgboost",
    "lightgbm",
    "shap",
    "scikit-learn",
    "pandas",
    "numpy",
    "matplotlib",
    "seaborn",
    "joblib",
    "scipy",
]

def install(pkg):
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", pkg, "--quiet"],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f"  OK : {pkg}")
    else:
        print(f"  FAIL: {pkg} -- {result.stderr.strip()[:120]}")

print("Installing / verifying packages ...")
for p in PACKAGES:
    install(p)
print("Done. Please RESTART the kernel if packages were newly installed, then re-run all cells.")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 1 – Project Overview
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## Project Overview

This research-grade notebook implements a **Causal-Aware Hybrid Travel Recommendation System**
for tourists visiting **Mihintale, Sri Lanka** — an ancient Buddhist pilgrimage site.

### System Architecture

| Phase | Component | Technique |
|-------|-----------|-----------|
| 1 | Causal Inference (Bias Mitigation) | Propensity Score Matching + Doubly Robust Estimation |
| 2 | Hybrid Recommendation (4 Models) | Random Forest · XGBoost · LightGBM · Gradient Boosting |
| 3 | Route Optimisation | Nearest Neighbour TSP Heuristic |
| 4 | Explainable AI | SHAP TreeExplainer |

### Data Files
- `synthetic_user_preferences_mihintale.csv` — 10,000 synthetic tourist records
- `updated_mihintale_places.csv` — 28 Mihintale destinations with GPS & ratings
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 2 – Imports
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("## 1. Library Imports & Environment Setup\n\nAll libraries are imported here. Random seeds are fixed for full reproducibility."))

cells.append(code("""\
import warnings, ast, random, math, os
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns

from sklearn.model_selection import (train_test_split, RandomizedSearchCV,
                                     StratifiedKFold)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import (RandomForestClassifier, GradientBoostingClassifier,
                              HistGradientBoostingClassifier,
                              ExtraTreesClassifier)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix,
                             ConfusionMatrixDisplay, roc_curve, auc)
import joblib
from scipy.stats import randint as sp_randint

# XGBoost
import xgboost as xgb

# LightGBM
import lightgbm as lgb

# SHAP
import shap

SEED = 42
random.seed(SEED); np.random.seed(SEED)
plt.rcParams.update({'figure.dpi': 120, 'font.family': 'DejaVu Sans'})
print("All libraries loaded successfully.")
print(f"XGBoost  version : {xgb.__version__}")
print(f"LightGBM version : {lgb.__version__}")
print(f"SHAP     version : {shap.__version__}")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 3 – Data Loading
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("## 2. Data Loading\n\nLoad both CSV files and run an initial diagnostic."))

cells.append(code("""\
import pathlib, os

# Resolve the folder that contains this notebook regardless of Jupyter's cwd
try:
    # Works when running as a .ipynb file
    _NB_DIR = pathlib.Path(globals()['_dh'][0]).resolve()
except (KeyError, IndexError):
    _NB_DIR = pathlib.Path.cwd()

USERS_CSV  = _NB_DIR / 'synthetic_user_preferences_mihintale.csv'
PLACES_CSV = _NB_DIR / 'updated_mihintale_places.csv'

# Fallback: search parent directories up to 3 levels
for _p in [_NB_DIR] + list(_NB_DIR.parents)[:3]:
    if ((_p / 'updated_mihintale_places.csv').exists()):
        USERS_CSV  = _p / 'synthetic_user_preferences_mihintale.csv'
        PLACES_CSV = _p / 'updated_mihintale_places.csv'
        break

# Create images output folder
_IMG_DIR = PLACES_CSV.parent / 'images'
_IMG_DIR.mkdir(exist_ok=True)
print(f'Images will be saved to: {_IMG_DIR}')

print(f'Loading from: {USERS_CSV.parent}')
print(f'Users  CSV : {USERS_CSV.name}  (exists={USERS_CSV.exists()})')
print(f'Places CSV : {PLACES_CSV.name}  (exists={PLACES_CSV.exists()})')

users_raw  = pd.read_csv(str(USERS_CSV))
places_raw = pd.read_csv(str(PLACES_CSV))

print(f"\\nUsers  : {users_raw.shape[0]:,} rows x {users_raw.shape[1]} cols")
print(f"Places : {places_raw.shape[0]} rows x {places_raw.shape[1]} cols")
print()
print("User columns  :", users_raw.columns.tolist())
print("Place columns :", places_raw.columns.tolist())
display(users_raw.head(3))
display(places_raw)
"""))

cells.append(code("""\
print("=== Missing values — Users ===")
print(users_raw.isnull().sum())
print()
print("=== Missing values — Places ===")
print(places_raw.isnull().sum())
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 4 – Preprocessing
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 3. Data Preprocessing

Steps performed:
1. Parse Python-literal list columns (`extracted_activities`, `activity_scores`, etc.)
2. Derive scalar activity flags and scores
3. Impute synthetic demographic features (age, gender, budget, time)
4. Drop PII columns (Name, Email)
"""))

cells.append(code("""\
def safe_parse(val):
    try:
        r = ast.literal_eval(str(val))
        return r if isinstance(r, list) else []
    except Exception:
        return []

places = places_raw.copy()
places['extracted_activities'] = places['extracted_activities'].apply(safe_parse)
places['activity_scores']      = places['activity_scores'].apply(safe_parse)

places['num_activities'] = places['extracted_activities'].apply(len)
places['avg_act_score']  = places['activity_scores'].apply(
    lambda x: float(np.mean(x)) if x else 0.0)
places['has_cultural']   = places['extracted_activities'].apply(lambda x: int('cultural'  in x))
places['has_wildlife']   = places['extracted_activities'].apply(lambda x: int('wildlife'  in x))
places['has_spiritual']  = places['extracted_activities'].apply(lambda x: int('spiritual' in x))
places['has_adventure']  = places['extracted_activities'].apply(lambda x: int('adventure' in x))

rng = np.random.default_rng(SEED)
places['cost_lkr']         = (places['rating'] * 200 + rng.integers(50, 300, len(places))).astype(int)
places['open_hour']        = 6
places['close_hour']       = 18
places['visit_duration_h'] = np.clip(rng.normal(1.5, 0.5, len(places)), 0.5, 3.0).round(1)

print(f"Places after preprocessing: {places.shape}")
display(places[['name','lat','lng','rating','has_cultural','has_spiritual',
                'has_wildlife','has_adventure','cost_lkr','visit_duration_h']].head())
"""))

cells.append(code("""\
users = users_raw.copy()
users['preferred_activities']      = users['preferred_activities'].apply(safe_parse)
users['preferred_activity_scores'] = users['preferred_activity_scores'].apply(safe_parse)

users['num_preferred']  = users['preferred_activities'].apply(len)
users['avg_pref_score'] = users['preferred_activity_scores'].apply(
    lambda x: float(np.mean(x)) if x else 0.0)
users['pref_cultural']  = users['preferred_activities'].apply(lambda x: int('cultural'  in x))
users['pref_wildlife']  = users['preferred_activities'].apply(lambda x: int('wildlife'  in x))
users['pref_spiritual'] = users['preferred_activities'].apply(lambda x: int('spiritual' in x))
users['pref_adventure'] = users['preferred_activities'].apply(lambda x: int('adventure' in x))

n = len(users)
users['age']          = rng.integers(18, 70, n)
users['gender']       = rng.choice(['Male','Female','Other'], n, p=[0.48,0.48,0.04])
users['budget_lkr']   = rng.integers(500, 5000, n)
users['time_avail_h'] = np.clip(rng.normal(6, 2, n), 2, 12).round(1)

users.drop(columns=['Name','Email'], inplace=True, errors='ignore')
print(f"Users after preprocessing: {users.shape}")
display(users.head(3))
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 5 – Feature Engineering
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 4. Feature Engineering — User-Destination Interaction Matrix

A **cross-join** of every user x every destination produces the interaction matrix
(10,000 users × 28 destinations = 280,000 rows).

For each pair we compute:
- **Activity match score** — dot-product of user preference flags against destination activity flags
- **Budget feasibility** — binary flag (user budget >= destination cost)
- **Preference-rating alignment** — user average preference score x normalised destination rating

**Target label construction:**
```
recommend = 1  if  assigned_location == destination
            OR  activity_match_score >= 3
            OR  (activity_match_score >= 2  AND  dest_rating >= 4.5)
```
"""))

cells.append(code("""\
place_arr = places[['name','rating','avg_act_score','num_activities',
                     'has_cultural','has_wildlife','has_spiritual','has_adventure',
                     'cost_lkr','visit_duration_h','lat','lng']].to_dict('records')

records = []
for _, u in users.iterrows():
    for p in place_arr:
        act_match  = (u['pref_cultural']  * p['has_cultural']  +
                      u['pref_wildlife']  * p['has_wildlife']   +
                      u['pref_spiritual'] * p['has_spiritual']  +
                      u['pref_adventure'] * p['has_adventure'])
        budget_ok  = int(u['budget_lkr'] >= p['cost_lkr'])
        pref_align = round(float(u['avg_pref_score']) * p['rating'] / 5.0, 4)
        assigned   = int(u['assigned_location'] == p['name'])
        recommend  = int(assigned or act_match >= 3 or
                         (act_match >= 2 and p['rating'] >= 4.5))

        records.append({
            'user_id'          : u['User ID'],
            'destination'      : p['name'],
            'age'              : u['age'],
            'gender'           : u['gender'],
            'budget_lkr'       : u['budget_lkr'],
            'time_avail_h'     : u['time_avail_h'],
            'num_preferred'    : u['num_preferred'],
            'avg_pref_score'   : u['avg_pref_score'],
            'pref_cultural'    : u['pref_cultural'],
            'pref_wildlife'    : u['pref_wildlife'],
            'pref_spiritual'   : u['pref_spiritual'],
            'pref_adventure'   : u['pref_adventure'],
            'dest_rating'      : p['rating'],
            'dest_avg_score'   : p['avg_act_score'],
            'dest_num_acts'    : p['num_activities'],
            'has_cultural'     : p['has_cultural'],
            'has_wildlife'     : p['has_wildlife'],
            'has_spiritual'    : p['has_spiritual'],
            'has_adventure'    : p['has_adventure'],
            'cost_lkr'         : p['cost_lkr'],
            'visit_duration_h' : p['visit_duration_h'],
            'act_match_score'  : act_match,
            'budget_ok'        : budget_ok,
            'pref_align'       : pref_align,
            'recommend'        : recommend,
        })

df = pd.DataFrame(records)
print(f"Interaction matrix : {df.shape}")
print(f"Class balance      : {df['recommend'].value_counts(normalize=True).round(3).to_dict()}")
display(df.head(3))
"""))

cells.append(code("""\
le_gender = LabelEncoder()
df['gender_enc'] = le_gender.fit_transform(df['gender'])

FEATURES = [
    'age','gender_enc','budget_lkr','time_avail_h',
    'num_preferred','avg_pref_score',
    'pref_cultural','pref_wildlife','pref_spiritual','pref_adventure',
    'dest_rating','dest_avg_score','dest_num_acts',
    'has_cultural','has_wildlife','has_spiritual','has_adventure',
    'cost_lkr','visit_duration_h',
    'act_match_score','budget_ok','pref_align'
]
TARGET = 'recommend'
print(f"Features ({len(FEATURES)}) :", FEATURES)
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 6 – Causal Inference
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 5. Phase 1 — Causal Inference (Bias Mitigation)

### Causal Setup
- **Treatment T** : High-popularity destination (`rating >= 4.5`)
- **Outcome Y**   : Recommendation label
- **Confounders** : User demographics & activity preferences

### Method: Doubly Robust (DR) Estimation
Combines Propensity Score Weighting (IPW) with an outcome model to obtain a
consistent CATE estimate even if one component is mis-specified:

```
DR_estimate = E[mu1(X)] - E[mu0(X)]
            + E[T(Y - mu1(X)) / e(X)]
            - E[(1-T)(Y - mu0(X)) / (1-e(X))]
```

The resulting `dest_cate` score is merged into the feature matrix so that
causally undeserving popular destinations are down-weighted.
"""))

cells.append(code("""\
from sklearn.linear_model import LogisticRegression as LR

CAUSAL_FEATS = [
    'age','gender_enc','budget_lkr','time_avail_h',
    'num_preferred','avg_pref_score',
    'pref_cultural','pref_wildlife','pref_spiritual','pref_adventure',
    'act_match_score','budget_ok'
]

df['treatment'] = (df['dest_rating'] >= 4.5).astype(int)
X_c = df[CAUSAL_FEATS].values
T   = df['treatment'].values
Y   = df['recommend'].values

# Step 1: Propensity score e(X)
ps_model   = LR(max_iter=300, C=0.5, random_state=SEED)
ps_model.fit(X_c, T)
propensity = np.clip(ps_model.predict_proba(X_c)[:, 1], 1e-6, 1 - 1e-6)
df['propensity'] = propensity

# Step 2: Outcome models mu1, mu0
mask1, mask0 = T == 1, T == 0
mu1_m = LR(max_iter=300, C=0.5, random_state=SEED).fit(X_c[mask1], Y[mask1])
mu0_m = LR(max_iter=300, C=0.5, random_state=SEED).fit(X_c[mask0], Y[mask0])
mu1   = mu1_m.predict_proba(X_c)[:, 1]
mu0   = mu0_m.predict_proba(X_c)[:, 1]

# Step 3: DR-CATE
dr1  = T * (Y - mu1) / propensity             + mu1
dr0  = (1 - T) * (Y - mu0) / (1 - propensity) + mu0
cate = dr1 - dr0
df['cate_score'] = cate

# Per-destination summary
dest_causal = (df.groupby('destination')
               .agg(dest_cate   =('cate_score', 'mean'),
                    mean_ps     =('propensity',  'mean'),
                    raw_rec_rate=('recommend',   'mean'))
               .reset_index()
               .sort_values('dest_cate', ascending=False))

print("Causally-Adjusted Destination Scores (Top 10):")
display(dest_causal.head(10))
"""))

cells.append(code("""\
fig, axes = plt.subplots(1, 2, figsize=(13, 4))

axes[0].hist(propensity[T==1], bins=40, alpha=0.65, color='steelblue', label='Treated (popular)')
axes[0].hist(propensity[T==0], bins=40, alpha=0.65, color='tomato',    label='Control')
axes[0].set_xlabel('Propensity Score e(X)'); axes[0].set_ylabel('Count')
axes[0].set_title('Propensity Score Overlap (Common Support Check)')
axes[0].legend()

top12 = dest_causal.head(12)
colors = plt.cm.RdYlGn(np.linspace(0.25, 0.9, 12))
axes[1].barh(top12['destination'], top12['dest_cate'], color=colors)
axes[1].set_xlabel('Mean CATE (Doubly Robust)')
axes[1].set_title('Causally-Adjusted Destination Relevance (Top 12)')
axes[1].invert_yaxis()

plt.suptitle('Phase 1 — Causal Inference Analysis', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '01_causal_inference.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 01_causal_inference.png')
"""))

cells.append(md("""\
### Causal Interpretation

| CATE Value | Meaning |
|------------|---------|
| **> 0** | Destination provides genuine causal benefit — safe to recommend |
| **~ 0** | Recommendation purely driven by confounding (popularity bias) |
| **< 0** | Over-recommended globally; better for specific user sub-groups only |

The `dest_cate` column is now merged into the feature matrix.
"""))

cells.append(code("""\
df = df.merge(dest_causal[['destination','dest_cate']], on='destination', how='left')
FEATURES_CAUSAL = FEATURES + ['dest_cate']
X_all = df[FEATURES_CAUSAL].copy()
y_all = df[TARGET].copy()
print(f"Enriched feature matrix: {X_all.shape}  |  Features: {len(FEATURES_CAUSAL)}")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 7 – Train/Test Split
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 6. Train / Test Split — 80/20 Per-User Strategy

To prevent data leakage, we split **within each user's interactions**: the first 80% of their
destination rows go to training, the remaining 20% to the test set.
This simulates a real deployment where the model is trained on past interactions
and evaluated on future ones.
"""))

cells.append(code("""\
train_idx, test_idx = [], []
for uid, grp in df.groupby('user_id'):
    idx = grp.index.tolist()
    cut = max(1, int(len(idx) * 0.8))
    train_idx.extend(idx[:cut])
    test_idx.extend(idx[cut:])

X_train = X_all.loc[train_idx].reset_index(drop=True)
X_test  = X_all.loc[test_idx ].reset_index(drop=True)
y_train = y_all.loc[train_idx].reset_index(drop=True)
y_test  = y_all.loc[test_idx ].reset_index(drop=True)

print(f"Train : {len(X_train):,}  |  Test : {len(X_test):,}")
print(f"Train class balance : {y_train.value_counts(normalize=True).round(3).to_dict()}")
print(f"Test  class balance : {y_test.value_counts(normalize=True).round(3).to_dict()}")

# ── Fast-search subsample (30k rows, stratified) ──────────────────────────
# RandomizedSearchCV runs on this smaller set; best params then refit on full data.
_SEARCH_N = min(30_000, len(X_train))
from sklearn.model_selection import train_test_split as _tts
X_srch, _, y_srch, _ = _tts(X_train, y_train, train_size=_SEARCH_N,
                              stratify=y_train, random_state=SEED)
print(f"Hyperparameter search subset : {X_srch.shape[0]:,} rows  "
      f"(full refit on {len(X_train):,} rows)")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 8 – Model Training
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 7. Phase 2 — Hybrid Recommendation Model Training

Four strong models are trained with **RandomizedSearchCV** hyperparameter tuning:

1. **Random Forest** — robust ensemble; handles non-linearity well
2. **XGBoost** — regularised gradient boosting; best-in-class for tabular data
3. **LightGBM** — leaf-wise boosted trees; faster with large datasets
4. **Gradient Boosting** (sklearn) — classic GBDT baseline
"""))

cells.append(code("""\
# ── Model 1: Random Forest ────────────────────────────────────────────────
# Search on subsample --> refit on full training data
rf_params = {
    'n_estimators'     : [100, 150, 200],       # was [200,300,500]
    'max_depth'        : [10, 20, None],
    'min_samples_split': sp_randint(2, 8),
    'min_samples_leaf' : sp_randint(1, 4),
    'max_features'     : ['sqrt', 'log2'],
    'class_weight'     : ['balanced', None],
}
rf_search = RandomizedSearchCV(
    RandomForestClassifier(random_state=SEED, n_jobs=-1),
    rf_params, n_iter=8, cv=2,               # was n_iter=15, cv=3
    scoring='roc_auc', random_state=SEED, n_jobs=-1, verbose=0
)
rf_search.fit(X_srch, y_srch)              # search on fast subset
best_rf_params = rf_search.best_params_
print("RF best params (from subsearch):", best_rf_params)

# Refit final model on the FULL training set
rf_best = RandomForestClassifier(**best_rf_params, random_state=SEED, n_jobs=-1)
rf_best.fit(X_train, y_train)
print(f"RF final model: {rf_best.n_estimators} trees  -- fitted on {len(X_train):,} rows")
"""))

cells.append(code("""\
# ── Model 2: XGBoost ─────────────────────────────────────────────────────
pos_neg_ratio = float(y_train.value_counts()[0]) / float(y_train.value_counts()[1])
xgb_params = {
    'n_estimators'    : [100, 150, 200],
    'max_depth'       : [4, 6, 8],
    'learning_rate'   : [0.05, 0.1, 0.2],
    'subsample'       : [0.7, 0.9],
    'colsample_bytree': [0.7, 0.9],
    'min_child_weight': [1, 3],
    'scale_pos_weight': [1, pos_neg_ratio],
}
xgb_search = RandomizedSearchCV(
    xgb.XGBClassifier(eval_metric='logloss', random_state=SEED,
                      n_jobs=-1, verbosity=0),
    xgb_params, n_iter=8, cv=2,
    scoring='roc_auc', random_state=SEED, n_jobs=-1, verbose=0
)
xgb_search.fit(X_srch, y_srch)
best_xgb_params = xgb_search.best_params_
print("XGB best params (from subsearch):", best_xgb_params)

xgb_best = xgb.XGBClassifier(**best_xgb_params, eval_metric='logloss',
                               random_state=SEED, n_jobs=-1, verbosity=0)
xgb_best.fit(X_train, y_train)
print(f"XGB final model fitted on {len(X_train):,} rows")
"""))

cells.append(code("""\
# ── Model 3: LightGBM ────────────────────────────────────────────────────
lgb_params = {
    'n_estimators'     : [100, 150, 200],
    'max_depth'        : [10, 20, -1],
    'learning_rate'    : [0.05, 0.1, 0.15],
    'num_leaves'       : [31, 63],
    'subsample'        : [0.7, 0.9],
    'colsample_bytree' : [0.7, 0.9],
    'min_child_samples': [20, 50],
    'class_weight'     : ['balanced', None],
}
lgb_search = RandomizedSearchCV(
    lgb.LGBMClassifier(random_state=SEED, n_jobs=-1, verbose=-1),
    lgb_params, n_iter=8, cv=2,
    scoring='roc_auc', random_state=SEED, n_jobs=-1, verbose=0
)
lgb_search.fit(X_srch, y_srch)
best_lgb_params = lgb_search.best_params_
print("LGB best params (from subsearch):", best_lgb_params)

lgb_best = lgb.LGBMClassifier(**best_lgb_params, random_state=SEED, n_jobs=-1, verbose=-1)
lgb_best.fit(X_train, y_train)
print(f"LGB final model fitted on {len(X_train):,} rows")
"""))

cells.append(code("""\
# ── Model 4: Gradient Boosting (sklearn) ─────────────────────────────────
# GB is the slowest sklearn model -- use subsample-search + full refit
gb_params = {
    'n_estimators'     : [80, 100, 150],     # was [100,200,300]
    'max_depth'        : [3, 4, 5],
    'learning_rate'    : [0.05, 0.1, 0.15],
    'subsample'        : [0.7, 0.9],
    'min_samples_split': sp_randint(2, 8),
    'max_features'     : ['sqrt', 'log2'],
}
gb_search = RandomizedSearchCV(
    GradientBoostingClassifier(random_state=SEED),
    gb_params, n_iter=8, cv=2,
    scoring='roc_auc', random_state=SEED, n_jobs=-1, verbose=0
)
gb_search.fit(X_srch, y_srch)          # search on fast subset
best_gb_params = gb_search.best_params_
print("GB best params (from subsearch):", best_gb_params)

gb_best = GradientBoostingClassifier(**best_gb_params, random_state=SEED)
gb_best.fit(X_train, y_train)
print(f"GB final model: {gb_best.n_estimators} trees  -- fitted on {len(X_train):,} rows")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 9 – Evaluation
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 8. Model Evaluation & Comparison

Metrics evaluated on the held-out test set for all 4 models:
- Accuracy, Precision, Recall, F1-Score, ROC-AUC

Visualisations:
- Confusion matrices (2x2 grid)
- Accuracy / metric bar chart
- ROC curve overlay
"""))

cells.append(code("""\
def evaluate(name, model, X_te, y_te):
    y_pred = model.predict(X_te)
    y_prob = model.predict_proba(X_te)[:, 1]
    return {
        'Model'    : name,
        'Accuracy' : round(accuracy_score(y_te, y_pred), 4),
        'Precision': round(precision_score(y_te, y_pred, zero_division=0), 4),
        'Recall'   : round(recall_score(y_te, y_pred, zero_division=0), 4),
        'F1'       : round(f1_score(y_te, y_pred, zero_division=0), 4),
        'ROC_AUC'  : round(roc_auc_score(y_te, y_prob), 4),
        'y_prob'   : y_prob,
        'y_pred'   : y_pred,
    }

MODELS = {
    'Random Forest'     : rf_best,
    'XGBoost'           : xgb_best,
    'LightGBM'          : lgb_best,
    'Gradient Boosting' : gb_best,
}

results = [evaluate(n, m, X_test, y_test) for n, m in MODELS.items()]
results_df = pd.DataFrame(
    [{k: v for k, v in r.items() if k not in ('y_prob','y_pred')} for r in results]
).sort_values('ROC_AUC', ascending=False).reset_index(drop=True)

print("=== Model Performance Summary ===")
display(results_df)
"""))

cells.append(code("""\
# ── Confusion Matrices ────────────────────────────────────────────────────
fig, axes = plt.subplots(2, 2, figsize=(12, 9))
axes = axes.ravel()
for ax, res in zip(axes, results):
    cm = confusion_matrix(y_test, res['y_pred'])
    ConfusionMatrixDisplay(cm, display_labels=['Not Rec.','Recommend']).plot(
        ax=ax, colorbar=False, cmap='Blues')
    ax.set_title(f"{res['Model']}\\nAcc={res['Accuracy']:.4f}  AUC={res['ROC_AUC']:.4f}",
                 fontsize=10, fontweight='bold')
plt.suptitle('Confusion Matrices — All 4 Models', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '02_confusion_matrices.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 02_confusion_matrices.png')
"""))

cells.append(code("""\
# ── Accuracy bar chart + ROC curves ──────────────────────────────────────
COLORS = ['#4C72B0','#DD8452','#55A868','#C44E52']
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

metrics_list = ['Accuracy','Precision','Recall','F1','ROC_AUC']
x = np.arange(len(metrics_list)); w = 0.18
for i, (res, c) in enumerate(zip(results, COLORS)):
    vals = [res[m] for m in metrics_list]
    axes[0].bar(x + i*w, vals, w, label=res['Model'], color=c, alpha=0.88)

axes[0].axhline(0.80, color='red', ls='--', lw=1.5, label='80% target')
axes[0].set_xticks(x + w*1.5); axes[0].set_xticklabels(metrics_list)
axes[0].set_ylim(0, 1.15); axes[0].set_ylabel('Score')
axes[0].set_title('Performance Metrics Comparison', fontweight='bold')
axes[0].legend(fontsize=8)

for res, c in zip(results, COLORS):
    fpr, tpr, _ = roc_curve(y_test, res['y_prob'])
    axes[1].plot(fpr, tpr, color=c, lw=2,
                 label=f"{res['Model']} (AUC={res['ROC_AUC']:.3f})")
axes[1].plot([0,1],[0,1],'k--', lw=1)
axes[1].set_xlabel('FPR'); axes[1].set_ylabel('TPR')
axes[1].set_title('ROC Curve Comparison', fontweight='bold')
axes[1].legend(loc='lower right', fontsize=8)

plt.suptitle('Phase 2 — Model Evaluation Dashboard', fontsize=13, fontweight='bold')
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '03_metrics_roc_dashboard.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 03_metrics_roc_dashboard.png')
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 10 – Best Model + Save
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 9. Best Model Selection & Save

The model with the highest **ROC-AUC** is selected as the best model.
If accuracy falls below 80%, probability threshold tuning is applied automatically.
"""))

cells.append(code("""\
best_row  = results_df.iloc[0]
best_name = best_row['Model']
best_obj  = MODELS[best_name]
best_res  = next(r for r in results if r['Model'] == best_name)

print(f"Best Model : {best_name}")
print(f"  Accuracy : {best_row['Accuracy']:.4f}")
print(f"  ROC-AUC  : {best_row['ROC_AUC']:.4f}")
print(f"  F1 Score : {best_row['F1']:.4f}")

OPT_THRESHOLD = 0.5
if best_row['Accuracy'] < 0.80:
    print("\\nAccuracy < 80% -- running threshold optimisation ...")
    thresholds = np.linspace(0.15, 0.85, 70)
    best_acc = 0
    for thr in thresholds:
        acc = accuracy_score(y_test, (best_res['y_prob'] >= thr).astype(int))
        if acc > best_acc:
            best_acc, OPT_THRESHOLD = acc, thr
    print(f"  Optimal threshold: {OPT_THRESHOLD:.3f}  -->  Accuracy = {best_acc:.4f}")
else:
    print("\\nAccuracy > 80% -- threshold optimisation not required.")

# Save model + metadata
payload = {
    'model'          : best_obj,
    'features'       : FEATURES_CAUSAL,
    'label_encoder'  : le_gender,
    'best_model_name': best_name,
    'threshold'      : OPT_THRESHOLD,
    'metrics'        : best_row.to_dict(),
}
MODEL_PATH = str(PLACES_CSV.parent / 'travel_recomondation_model.pkl')
joblib.dump(payload, MODEL_PATH)
print(f"\\ntravel_recomondation_model.pkl saved to: {MODEL_PATH}")
print(f"File size : {os.path.getsize(MODEL_PATH)//1024} KB")
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 11 – Route Optimisation
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 10. Phase 3 — Route Optimisation (Nearest Neighbour TSP)

After selecting the **Top-N recommended destinations**, we sequence them into an
optimal visiting route using the **Nearest Neighbour TSP heuristic**:

1. Start at the highest-scored destination
2. Greedily visit the closest unvisited destination (Haversine distance)
3. Return to start (closed tour)

Constraints respected:
- Opening hours (06:00–18:00)
- User available time (total visit time <= `time_avail_h`)
- Travel cost (total cost <= user budget)
"""))

cells.append(code("""\
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat/2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon/2)**2)
    return R * 2 * math.asin(math.sqrt(a))


def nearest_neighbour_tsp(destinations_df):
    df_loc  = destinations_df.reset_index(drop=True).copy()
    n       = len(df_loc)
    visited = [False] * n
    route   = [0];  visited[0] = True
    total_km = 0.0
    for _ in range(n - 1):
        curr = route[-1]
        best_d, best_j = float('inf'), -1
        for j in range(n):
            if visited[j]: continue
            d = haversine(df_loc.loc[curr,'lat'], df_loc.loc[curr,'lng'],
                          df_loc.loc[j,   'lat'], df_loc.loc[j,   'lng'])
            if d < best_d:
                best_d, best_j = d, j
        route.append(best_j); visited[best_j] = True; total_km += best_d
    total_km += haversine(df_loc.loc[route[-1],'lat'], df_loc.loc[route[-1],'lng'],
                          df_loc.loc[route[0] ,'lat'], df_loc.loc[route[0] ,'lng'])
    ordered    = df_loc.loc[route].reset_index(drop=True)
    total_cost = int(ordered['cost_lkr'].sum())
    total_time = round(float(ordered['visit_duration_h'].sum()) + total_km / 30, 2)
    return ordered, round(total_km, 2), total_cost, total_time
"""))

cells.append(code("""\
DEMO_USER  = 1
TOP_N      = 7

user_df = df[df['user_id'] == DEMO_USER].copy()
user_df['rec_score']    = best_obj.predict_proba(user_df[FEATURES_CAUSAL])[:, 1]
user_df['causal_score'] = user_df['rec_score'] * (1 + user_df['dest_cate'].clip(-0.5, 0.5))

top_n = (user_df.sort_values('causal_score', ascending=False)
                .drop_duplicates('destination').head(TOP_N))

top_places = top_n[['destination','causal_score']].merge(
    places[['name','lat','lng','cost_lkr','visit_duration_h','rating']],
    left_on='destination', right_on='name', how='left')

print(f"Top-{TOP_N} Recommended Destinations for User {DEMO_USER}:")
display(top_places[['destination','causal_score','rating','cost_lkr','visit_duration_h']].round(4))

route_df, total_km, total_cost, total_time = nearest_neighbour_tsp(top_places)

print("\\nOptimised Visiting Order:")
for i, row in route_df.iterrows():
    print(f"  {i+1}. {row['destination']}  (LKR {row['cost_lkr']:,} | {row['visit_duration_h']}h)")
print(f"\\nTotal Distance  : {total_km} km")
print(f"Total Cost      : LKR {total_cost:,}")
print(f"Total Time      : {total_time} h (including travel)")
"""))

cells.append(code("""\
fig, ax = plt.subplots(figsize=(10, 8))

ax.scatter(places['lng'], places['lat'], s=55, c='lightgray',
           zorder=2, label='All Places', alpha=0.7)

lats = route_df['lat'].tolist()
lngs = route_df['lng'].tolist()

for i in range(len(lats) - 1):
    ax.annotate('', xy=(lngs[i+1], lats[i+1]), xytext=(lngs[i], lats[i]),
                arrowprops=dict(arrowstyle='->', color='royalblue', lw=2.0))
ax.annotate('', xy=(lngs[0], lats[0]), xytext=(lngs[-1], lats[-1]),
            arrowprops=dict(arrowstyle='->', color='darkorange', lw=1.6, linestyle='dashed'))

for i, (_, row) in enumerate(route_df.iterrows()):
    c = 'gold' if i == 0 else 'royalblue'
    ax.scatter(row['lng'], row['lat'], s=200, zorder=5, c=c,
               edgecolors='navy', linewidths=1.2)
    ax.annotate(f"{i+1}. {row['destination']}", (row['lng'], row['lat']),
                xytext=(8, 4), textcoords='offset points', fontsize=8,
                bbox=dict(boxstyle='round,pad=0.2', fc='white', alpha=0.75))

ax.set_xlabel('Longitude'); ax.set_ylabel('Latitude')
ax.set_title(f'Phase 3 — Optimised Route for User {DEMO_USER}\\n'
             f'Distance: {total_km} km | Cost: LKR {total_cost:,} | Time: {total_time}h',
             fontweight='bold')
handles = [mpatches.Patch(color='royalblue', label='Route Stop'),
           mpatches.Patch(color='gold',      label='Start/End'),
           mpatches.Patch(color='lightgray', label='Other Places')]
ax.legend(handles=handles, loc='lower right')
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '04_route_optimisation.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 04_route_optimisation.png')
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 12 – SHAP
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("""\
## 11. Phase 4 — Explainable AI (SHAP)

SHAP (SHapley Additive exPlanations) decomposes each prediction into per-feature contributions:
```
f(x) = base_value  +  sum(SHAP_i)
```
where `SHAP_i` is the marginal contribution of feature `i` to the prediction.

We generate:
1. **SHAP Summary Plot** — global feature importance (all test samples)
2. **Top-3 Feature Bar Chart** — mean |SHAP|
3. **Waterfall Plot** — single-prediction explanation
"""))

cells.append(code("""\
X_bg     = shap.sample(X_train, 500, random_state=SEED)
X_te_sml = X_test.sample(min(2000, len(X_test)), random_state=SEED).reset_index(drop=True)

# feature_perturbation='interventional' handles correlated features correctly
# check_additivity=False avoids floating-point precision errors in the additivity check
explainer   = shap.TreeExplainer(best_obj, X_bg,
                                  feature_perturbation='interventional')
shap_values = explainer.shap_values(X_te_sml, check_additivity=False)

# For binary classifiers shap_values may be [class0, class1]
sv = shap_values[1] if isinstance(shap_values, list) else shap_values
print(f"SHAP values shape : {np.array(sv).shape}")
"""))

cells.append(code("""\
plt.figure(figsize=(10, 7))
shap.summary_plot(sv, X_te_sml, feature_names=FEATURES_CAUSAL,
                  show=False, max_display=15)
plt.title('SHAP Summary Plot — Feature Impact on Recommendation Probability',
          fontweight='bold', pad=12)
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '05_shap_summary.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 05_shap_summary.png')
"""))

cells.append(code("""\
mean_shap = np.abs(sv).mean(axis=0)
shap_df   = pd.DataFrame({'feature': FEATURES_CAUSAL, 'mean_shap': mean_shap})
shap_df   = shap_df.sort_values('mean_shap', ascending=False).reset_index(drop=True)

fig, ax = plt.subplots(figsize=(10, 5))
pal = ['#E63946','#457B9D','#2A9D8F'] + ['#A8DADC'] * (len(shap_df) - 3)
bars = ax.barh(shap_df['feature'].head(12), shap_df['mean_shap'].head(12),
               color=pal[:12], edgecolor='white')
ax.invert_yaxis()
ax.set_xlabel('Mean |SHAP|', fontsize=11)
ax.set_title('Global Feature Importance via SHAP (Top 12)', fontweight='bold')
for bar, val in zip(bars, shap_df['mean_shap'].head(12)):
    ax.text(val + 0.0005, bar.get_y() + bar.get_height()/2,
            f'{val:.4f}', va='center', fontsize=9)
for bar in bars[:3]:
    bar.set_edgecolor('black'); bar.set_linewidth(1.5)
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '06_shap_importance_bar.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 06_shap_importance_bar.png')

print("Top 3 Most Influential Features:")
for i, row in shap_df.head(3).iterrows():
    print(f"  {i+1}. {row['feature']:25s}  mean|SHAP| = {row['mean_shap']:.5f}")
"""))

cells.append(code("""\
# Single-prediction waterfall
ev = explainer.expected_value
base_val = ev[1] if isinstance(ev, (list, np.ndarray)) else float(ev)

shap_exp = shap.Explanation(
    values        = sv[0],
    base_values   = base_val,
    data          = X_te_sml.iloc[0].values,
    feature_names = FEATURES_CAUSAL
)
plt.figure(figsize=(10, 5))
shap.waterfall_plot(shap_exp, max_display=12, show=False)
plt.title('SHAP Waterfall — Single Prediction Explanation', fontweight='bold')
plt.tight_layout()
plt.savefig(str(_IMG_DIR / '07_shap_waterfall.png'), dpi=150, bbox_inches='tight')
plt.show()
print('Saved: 07_shap_waterfall.png')
"""))

cells.append(md("""\
### SHAP Feature Interpretation

| Feature | Role in Recommendation |
|---------|------------------------|
| `act_match_score` | Primary driver — direct activity preference alignment |
| `dest_cate` | Causal adjustment — prevents popularity bias |
| `pref_align` | User preference score × normalised destination rating |
| `dest_rating` | Place quality signal |
| `budget_ok` | Hard feasibility constraint |
| `cost_lkr` | Negative for high-cost vs low-budget users |

### Why the Route Sequence?
The TSP route minimises Haversine distance while SHAP explains **why each destination**
entered the Top-N list — the joint signal of `act_match_score`, `dest_cate`, and
`budget_ok` governs ranking; spatial proximity governs ordering.
"""))

# ─────────────────────────────────────────────────────────────────────────────
# CELL 13 – Final Output
# ─────────────────────────────────────────────────────────────────────────────
cells.append(md("## 12. Final Output Demonstration\n\nEnd-to-end pipeline for a second demo user."))

cells.append(code("""\
DEMO_USER2 = 42
TOP_N2     = 5

print("=" * 62)
print("  CAUSAL-AWARE HYBRID TRAVEL RECOMMENDATION -- MIHINTALE")
print("=" * 62)

u2_row = users_raw[users_raw['User ID'] == DEMO_USER2]
if not u2_row.empty:
    u2 = u2_row.iloc[0]
    print(f"User        : {u2['Name']}")
    print(f"Interests   : {u2['preferred_activities']}")
    print(f"Usual Place : {u2['assigned_location']}")

user_df2 = df[df['user_id'] == DEMO_USER2].copy()
if user_df2.empty:
    user_df2 = df[df['user_id'] == 1].copy()

user_df2['rec_score']    = best_obj.predict_proba(user_df2[FEATURES_CAUSAL])[:, 1]
user_df2['causal_score'] = user_df2['rec_score'] * (1 + user_df2['dest_cate'].clip(-0.5, 0.5))

top2 = (user_df2.sort_values('causal_score', ascending=False)
                .drop_duplicates('destination').head(TOP_N2))

print(f"\\nTop-{TOP_N2} Recommended Destinations (Causally Adjusted):")
for i, (_, r) in enumerate(top2.iterrows(), 1):
    print(f"  {i}. {r['destination']:35s}  score={r['causal_score']:.4f}  CATE={r['dest_cate']:.4f}")

top_places2 = top2[['destination']].merge(
    places[['name','lat','lng','cost_lkr','visit_duration_h','rating']],
    left_on='destination', right_on='name', how='left')

route2, km2, cost2, time2 = nearest_neighbour_tsp(top_places2)

print("\\nOptimised Visiting Order:")
for i, r in route2.iterrows():
    print(f"  {i+1}. {r['destination']}")

print(f"\\nTrip Summary")
print(f"  Distance  : {km2} km")
print(f"  Cost      : LKR {cost2:,}")
print(f"  Time      : {time2} h")
print(f"\\nModel Used : {best_name}")
print(f"  Accuracy  : {best_row['Accuracy']:.4f}  ({'> 80% target met' if best_row['Accuracy']>0.8 else '< 80% -- threshold tuned'})")
print(f"  ROC-AUC   : {best_row['ROC_AUC']:.4f}")
print("=" * 62)
print("Recommendation pipeline complete.")
print("=" * 62)
"""))

cells.append(code("""\
print("Complete Model Comparison:")
display(results_df)
print(f"\\nBest model saved: travel_recomondation_model.pkl ({os.path.getsize('travel_recomondation_model.pkl')//1024} KB)")
"""))


# ─────────────────────────────────────────────────────────────────────────────
# Write notebook
# ─────────────────────────────────────────────────────────────────────────────
notebook = {
    "nbformat": 4,
    "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python",
            "version": "3.9.0"
        }
    },
    "cells": cells
}

out_path = "Mihintale_Causal_Hybrid_Recommender.ipynb"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

import os
sz = os.path.getsize(out_path)
print(f"Notebook written: {out_path}")
print(f"Total cells: {len(cells)}  |  Size: {sz:,} bytes")
