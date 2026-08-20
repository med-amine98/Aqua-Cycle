"""
Quick integration test for all new AI modules.
Run from backend/: python test_ai_modules.py
"""
import asyncio
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.dirname(__file__))

results = {}

# ── 1. Random Forest ──────────────────────────────────────────────────────────
print("\n=== 1. Random Forest Water Predictor ===")
try:
    from src.services.rf_water_predictor import rf_water_predictor
    pred = rf_water_predictor.predict(
        temperature=28, humidity=55, wind_speed=12, precipitation=1,
        area_ha=2, crop_type="vegetables", soil_type="loam",
        irrigation_system="drip", growth_stage="flowering", forecast_days=3
    )
    print(f"  ✅ RF trained: {rf_water_predictor._trained}")
    print(f"  ✅ sklearn: {rf_water_predictor._sklearn_available}")
    print(f"  ✅ Total predicted: {pred['total_predicted_m3']} m³")
    print(f"  ✅ Model: {pred['model']}")
    results["rf"] = "PASS"
except Exception as e:
    print(f"  ❌ RF Error: {e}")
    results["rf"] = f"FAIL: {e}"

# ── 2. CNN ─────────────────────────────────────────────────────────────────────
print("\n=== 2. CNN Disease Detector ===")
try:
    from src.services.cnn_disease_detector import cnn_detector
    print(f"  ℹ️  PyTorch available: {cnn_detector._torch_available}")
    print(f"  ℹ️  Model loaded: {cnn_detector._model is not None}")

    # Create a dummy image
    from PIL import Image
    import io
    img = Image.new("RGB", (224, 224), color=(80, 150, 60))  # greenish
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    result = asyncio.run(cnn_detector.analyze(buf.read(), "plant"))
    print(f"  ✅ Status: {result['status']}")
    print(f"  ✅ Health: {result['health_status']}")
    print(f"  ✅ Confidence: {result['confidence']}%")
    results["cnn"] = "PASS"
except Exception as e:
    print(f"  ❌ CNN Error: {e}")
    results["cnn"] = f"FAIL: {e}"

# ── 3. YOLO ────────────────────────────────────────────────────────────────────
print("\n=== 3. YOLO Disease Detector ===")
try:
    from src.services.yolo_disease_detector import yolo_detector
    print(f"  ℹ️  ultralytics available: {yolo_detector._available}")
    print(f"  ℹ️  Model loaded: {yolo_detector._model is not None}")

    from PIL import Image
    import io
    img = Image.new("RGB", (640, 480), color=(30, 100, 30))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    result = asyncio.run(yolo_detector.detect(buf.read(), "plant"))
    print(f"  ✅ Status: {result['status']}")
    print(f"  ✅ Detections: {result['detection_count']}")
    print(f"  ✅ Health: {result['health_status']}")
    results["yolo"] = "PASS"
except Exception as e:
    print(f"  ❌ YOLO Error: {e}")
    results["yolo"] = f"FAIL: {e}"

# ── 4. Atmospheric Service ─────────────────────────────────────────────────────
print("\n=== 4. Atmospheric Service ===")
try:
    from src.services.atmospheric_service import atmospheric_service

    # Algiers coordinates
    forecast = asyncio.run(atmospheric_service.get_forecast(36.7, 3.0, days=3))
    print(f"  ✅ Source: {forecast['source']}")
    print(f"  ✅ Forecast days: {len(forecast['forecasts'])}")
    if forecast["forecasts"]:
        f0 = forecast["forecasts"][0]
        print(f"  ✅ Day 1: temp={f0.get('temperature')}°C, precip={f0.get('precipitation')}mm")

    current = asyncio.run(atmospheric_service.get_current_conditions(36.7, 3.0))
    print(f"  ✅ Current conditions source: {current['source']}")
    results["atmospheric"] = "PASS"
except Exception as e:
    print(f"  ❌ Atmospheric Error: {e}")
    results["atmospheric"] = f"FAIL: {e}"

# ── 5. Main app import ─────────────────────────────────────────────────────────
print("\n=== 5. Main App Import ===")
try:
    import importlib.util
    spec = importlib.util.spec_from_file_location("main", "main.py")
    # Just check the routes import works
    from src.api.routes import ai_models
    print(f"  ✅ ai_models router loaded: {ai_models.router.prefix}")
    results["main_import"] = "PASS"
except Exception as e:
    print(f"  ❌ Main import error: {e}")
    results["main_import"] = f"FAIL: {e}"

# ── Summary ────────────────────────────────────────────────────────────────────
print("\n" + "="*50)
print("SUMMARY:")
for module, status in results.items():
    icon = "✅" if status == "PASS" else "❌"
    print(f"  {icon} {module}: {status}")

all_pass = all(v == "PASS" for v in results.values())
print(f"\n{'🎉 All tests PASSED!' if all_pass else '⚠️  Some tests FAILED (check above)'}")
sys.exit(0 if all_pass else 1)
