"""
Random Forest Water Consumption Predictor — AquaCycle
Trains a scikit-learn RandomForestRegressor on historical farm data.
If no training data is available, uses a rule-based fallback.
Model is persisted to disk and hot-reloaded if it exists.
"""

import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml_models", "rf_water_consumption.joblib"
)
SCALER_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml_models", "rf_water_scaler.joblib"
)

# Feature column order (must match training data)
FEATURE_COLUMNS = [
    "temperature",
    "humidity",
    "wind_speed",
    "precipitation",
    "area_ha",
    "crop_coeff",          # Kc
    "soil_retention",      # soil water retention factor
    "irrigation_efficiency",
    "day_of_year",
    "growth_stage_enc",    # encoded growth stage 0-5
]

# Crop coefficients
CROP_KC = {
    "cereals": 0.85, "vegetables": 1.0, "fruits": 0.9,
    "olives": 0.65, "dates": 0.85, "legumes": 0.75,
    "default": 0.8,
}

# Soil retention factors (higher = retains more water → less irrigation needed)
SOIL_RETENTION = {
    "clay": 0.8, "sand": 1.3, "loam": 1.0, "silt": 0.95,
    "limestone": 1.1, "peat": 0.7, "default": 1.0,
}

# Irrigation efficiency
IRRIGATION_EFF = {
    "drip": 0.92, "sprinkler": 0.80, "gravity": 0.60,
    "subsurface": 0.90, "manual": 0.55, "default": 0.75,
}

# Growth stage encoding
GROWTH_STAGE_ENC = {
    "seedling": 0, "vegetative": 1, "flowering": 2,
    "fruiting": 3, "maturation": 4, "harvest": 5,
}


def _encode_features(
    temperature: float,
    humidity: float,
    wind_speed: float,
    precipitation: float,
    area_ha: float,
    crop_type: str,
    soil_type: str,
    irrigation_system: str,
    growth_stage: str,
    date: Optional[datetime] = None,
) -> np.ndarray:
    """Convert raw inputs to numeric feature vector."""
    doy = (date or datetime.now()).timetuple().tm_yday
    crop_coeff = CROP_KC.get(crop_type.lower(), CROP_KC["default"])
    soil_ret = SOIL_RETENTION.get(soil_type.lower(), SOIL_RETENTION["default"])
    irr_eff = IRRIGATION_EFF.get(irrigation_system.lower().replace("-", ""), IRRIGATION_EFF["default"])
    gse = GROWTH_STAGE_ENC.get(growth_stage.lower(), 2)

    return np.array([
        temperature, humidity, wind_speed, precipitation,
        area_ha, crop_coeff, soil_ret, irr_eff, doy, gse
    ], dtype=np.float32)


def _generate_synthetic_data(n_samples: int = 2000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training data for bootstrap training.
    Based on agronomic formulas: ETc = ETo * Kc / irrigation_efficiency
    ETo ≈ 0.0023 * (T + 17.8) * sqrt(T) * (0.5 + 0.01 * wind)
    """
    rng = np.random.default_rng(42)

    temps = rng.uniform(10, 45, n_samples)
    hums = rng.uniform(20, 95, n_samples)
    winds = rng.uniform(0, 40, n_samples)
    precips = rng.uniform(0, 30, n_samples)
    areas = rng.uniform(0.5, 50, n_samples)
    kcs = rng.choice(list(CROP_KC.values()), n_samples)
    soils = rng.choice(list(SOIL_RETENTION.values()), n_samples)
    irrs = rng.choice(list(IRRIGATION_EFF.values()), n_samples)
    doys = rng.integers(1, 366, n_samples)
    gses = rng.integers(0, 6, n_samples)

    X = np.column_stack([temps, hums, winds, precips, areas, kcs, soils, irrs, doys, gses])

    # Compute ETo and ETc
    eto = np.maximum(0.0023 * (temps + 17.8) * np.sqrt(np.maximum(temps, 0)) * (0.5 + 0.01 * winds), 0)
    etc = eto * kcs / irrs

    # Total water need (m³/ha/day), adjusted for precipitation
    y = np.maximum((etc * 10 - precips * 0.8) * soils * areas + rng.normal(0, 0.5, n_samples), 0)

    return X, y


class RandomForestWaterPredictor:
    """
    Random Forest model for water consumption prediction.
    Auto-trains on synthetic data if no real data or saved model exists.
    """

    def __init__(self):
        self._model = None
        self._scaler = None
        self._trained = False
        self._sklearn_available = self._try_init()

    def _try_init(self) -> bool:
        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.preprocessing import StandardScaler

            # Try to load existing model
            if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
                self._model = joblib.load(MODEL_PATH)
                self._scaler = joblib.load(SCALER_PATH)
                self._trained = True
                logger.info("[RF] Loaded existing model from disk.")
            else:
                logger.info("[RF] No saved model — training on synthetic data...")
                self._train_on_synthetic(RandomForestRegressor, StandardScaler)

            return True
        except ImportError:
            logger.warning("[RF] scikit-learn not installed — using rule-based fallback.")
            return False
        except Exception as exc:
            logger.error(f"[RF] Init error: {exc}")
            return False

    def _train_on_synthetic(self, RFClass, ScalerClass):
        from sklearn.model_selection import train_test_split

        X, y = _generate_synthetic_data(3000)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

        scaler = ScalerClass()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        model = RFClass(
            n_estimators=150,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train_s, y_train)

        score = model.score(X_test_s, y_test)
        logger.info(f"[RF] Trained — R² score: {score:.3f}")

        # Persist
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(model, MODEL_PATH)
        joblib.dump(scaler, SCALER_PATH)

        self._model = model
        self._scaler = scaler
        self._trained = True

    def train_on_data(self, records: List[Dict]) -> Dict[str, Any]:
        """
        Re-train model on real historical data provided as a list of dicts.
        Each record must have keys matching FEATURE_COLUMNS + 'actual_consumption'.
        """
        if not self._sklearn_available:
            return {"status": "error", "message": "scikit-learn non disponible"}

        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.preprocessing import StandardScaler
            from sklearn.model_selection import train_test_split

            df = pd.DataFrame(records)
            X = df[FEATURE_COLUMNS].values
            y = df["actual_consumption"].values

            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            scaler = StandardScaler()
            X_train_s = scaler.fit_transform(X_train)
            X_test_s = scaler.transform(X_test)

            model = RandomForestRegressor(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
            model.fit(X_train_s, y_train)
            score = model.score(X_test_s, y_test)

            joblib.dump(model, MODEL_PATH)
            joblib.dump(scaler, SCALER_PATH)
            self._model = model
            self._scaler = scaler
            self._trained = True

            return {
                "status": "success",
                "r2_score": round(score, 4),
                "n_samples": len(records),
                "model": "RandomForest (sklearn)",
                "message": f"Modèle entraîné avec {len(records)} échantillons. R²={score:.4f}"
            }
        except Exception as exc:
            return {"status": "error", "message": str(exc)}

    def get_feature_importance(self) -> List[Dict]:
        """Return feature importances ranked by importance."""
        if not self._trained or self._model is None:
            return []
        importances = self._model.feature_importances_
        return sorted(
            [{"feature": FEATURE_COLUMNS[i], "importance": round(float(v), 4)}
             for i, v in enumerate(importances)],
            key=lambda x: x["importance"], reverse=True
        )

    def predict(
        self,
        temperature: float,
        humidity: float,
        wind_speed: float,
        precipitation: float,
        area_ha: float,
        crop_type: str = "vegetables",
        soil_type: str = "loam",
        irrigation_system: str = "drip",
        growth_stage: str = "vegetative",
        forecast_days: int = 7,
    ) -> Dict[str, Any]:
        """
        Predict water consumption for forecast_days.
        Returns daily predictions with confidence intervals.
        """
        predictions = []
        base_date = datetime.now()

        for i in range(forecast_days):
            date = base_date + timedelta(days=i)
            # Add slight variation per day
            temp_var = temperature + np.random.normal(0, 1.5)
            hum_var = humidity + np.random.normal(0, 3)
            wind_var = wind_speed + np.random.normal(0, 1)
            precip_var = max(0, precipitation + np.random.normal(0, 1))

            feat = _encode_features(
                temp_var, hum_var, wind_var, precip_var,
                area_ha, crop_type, soil_type, irrigation_system, growth_stage, date
            )

            if self._sklearn_available and self._trained:
                feat_scaled = self._scaler.transform(feat.reshape(1, -1))
                # Tree-level predictions for confidence interval
                tree_preds = np.array([
                    tree.predict(feat_scaled)[0]
                    for tree in self._model.estimators_
                ])
                predicted = float(np.mean(tree_preds))
                std = float(np.std(tree_preds))
                ci_lower = max(0, predicted - 1.96 * std)
                ci_upper = predicted + 1.96 * std
                confidence = max(55, 95 - i * 3)
            else:
                # Rule-based fallback
                kc = CROP_KC.get(crop_type.lower(), 0.8)
                sr = SOIL_RETENTION.get(soil_type.lower(), 1.0)
                ie = IRRIGATION_EFF.get(irrigation_system.lower(), 0.75)
                eto = max(0, 0.0023 * (temp_var + 17.8) * (max(temp_var, 0) ** 0.5) * (0.5 + 0.01 * wind_var))
                predicted = max(0, (eto * kc / ie * 10 - precip_var * 0.8) * sr * area_ha)
                ci_lower = predicted * 0.8
                ci_upper = predicted * 1.2
                confidence = max(55, 85 - i * 3)

            predictions.append({
                "date": date.strftime("%Y-%m-%d"),
                "predicted_m3": round(predicted, 2),
                "ci_lower": round(ci_lower, 2),
                "ci_upper": round(ci_upper, 2),
                "confidence": round(confidence, 1),
                "temperature": round(temp_var, 1),
                "precipitation": round(precip_var, 1),
            })

        total = sum(p["predicted_m3"] for p in predictions)
        feature_imp = self.get_feature_importance()[:5]

        return {
            "model": "Random Forest (sklearn)" if self._sklearn_available else "Règles agronomiques",
            "predictions": predictions,
            "total_predicted_m3": round(total, 2),
            "average_daily_m3": round(total / forecast_days, 2),
            "crop_type": crop_type,
            "soil_type": soil_type,
            "irrigation_system": irrigation_system,
            "area_ha": area_ha,
            "top_features": feature_imp,
            "unit": "m³",
            "forecast_days": forecast_days,
            "status": "success"
        }


# Singleton
rf_water_predictor = RandomForestWaterPredictor()
