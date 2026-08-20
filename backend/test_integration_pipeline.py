"""
Quick integration test for new integration pipeline, recommendation engine,
health score engine, and alert engine.
Run from backend/: python test_integration_pipeline.py
"""
import asyncio
import sys
import os

# Add backend root to path
sys.path.insert(0, os.path.dirname(__file__))

async def run_tests():
    # Force output encoding to utf-8 to handle emojis in windows console
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    print("\n=== Testing Crop Health Score Engine ===")
    from src.services.health_score_engine import health_score_engine
    
    crops = [
        {"id": "crop_1", "name": "Tomates", "type": "vegetables", "growth_stage": "floraison", "area": 2.5},
        {"id": "crop_2", "name": "Blé", "type": "cereals", "growth_stage": "semis", "area": 10.0}
    ]
    weather = {"temperature": 36.5, "humidity": 28.0, "wind_speed": 18.0, "precipitation": 0.0, "source": "Open-Meteo"}
    water_predictions = [
        {"date": "2026-08-14", "predicted_m3": 15.0, "confidence": 92},
        {"date": "2026-08-15", "predicted_m3": 18.5, "confidence": 88}
    ]
    water_records = [
        {"volume": 12.0, "date": "2026-08-12"},
        {"volume": 11.5, "date": "2026-08-11"}
    ]
    disease_detections = [
        {"id": "d1", "disease_name": "Tomato___Early_blight", "confidence": 72, "plant_type": "tomates"}
    ]
    farm = {"soil_type": "loam", "irrigation_system": "drip"}

    health = health_score_engine.compute_farm_health(
        crops=crops,
        weather=weather,
        water_predictions=water_predictions,
        water_records=water_records,
        disease_detections=disease_detections,
        farm=farm
    )
    print(f"  [OK] Overall Health Score: {health['overall_score']}/100")
    print(f"  [OK] Grade: {health['grade']} (Color: {health['color']})")
    print(f"  [OK] Factors NDVI score: {health['factors']['ndvi']['score']}")
    print(f"  [OK] Factors Disease score: {health['factors']['disease']['score']}")

    print("\n=== Testing Smart Alert Engine ===")
    from src.services.alert_engine import alert_engine
    alerts = alert_engine.generate_alerts(
        weather=weather,
        water_predictions=water_predictions,
        water_records=water_records,
        crops=crops,
        disease_detections=disease_detections,
        health_score=health,
        farm=farm
    )
    print(f"  [OK] Generated Alerts: {len(alerts)}")
    for a in alerts[:3]:
        print(f"    - [{a['priority'].upper()}] {a['title']}: {a['message']} (Action: {a['action']})")

    print("\n=== Testing Recommendation Engine ===")
    from src.services.recommendation_engine import recommendation_engine
    recs = recommendation_engine.generate_recommendations(
        weather=weather,
        water_predictions=water_predictions,
        crops=crops,
        water_records=water_records,
        disease_history=disease_detections,
        farm=farm
    )
    print(f"  [OK] Generated Recommendations: {len(recs)}")
    for r in recs[:3]:
        print(f"    - [{r['priority'].upper()}] {r['title']}")
        print(f"      Description: {r['description']}")
        print(f"      Action: {r['action']}")

    print("\n=== Testing Integration Pipeline Orchestrator ===")
    from src.services.integration_pipeline import integration_pipeline
    
    # Run integration pipeline
    pipeline_res = await integration_pipeline.get_farm_status(
        farm={"latitude": 36.8, "longitude": 10.18, "total_area": 5.0, "soil_type": "loam", "irrigation_system": "drip"},
        crops=crops,
        water_records=water_records,
        disease_detections=disease_detections,
        waste_available=[]
    )
    print(f"  [OK] Pipeline Execution Status: {pipeline_res['status']}")
    print(f"  [OK] Computed Health Score: {pipeline_res['health_score']['overall_score']}")
    print(f"  [OK] Integrated Alerts count: {len(pipeline_res['alerts'])}")
    print(f"  [OK] Integrated Recommendations count: {len(pipeline_res['recommendations'])}")
    print(f"  [OK] Current Weather Temp: {pipeline_res['weather']['current']['temperature']}°C")

if __name__ == "__main__":
    asyncio.run(run_tests())
