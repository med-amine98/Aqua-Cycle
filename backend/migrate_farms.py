import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.database import SessionLocal, engine
from src.models.farm import Farm, SoilType, IrrigationSystem
from sqlalchemy import text

def migrate_farms():
    db = SessionLocal()
    try:
        # 1. Vérifier les fermes existantes
        farms = db.query(Farm).all()
        print(f"📊 {len(farms)} fermes trouvées")
        
        # 2. Mettre à jour les types de sol
        soil_mapping = {
            "CLAY": SoilType.CLAY,
            "SANDY": SoilType.SANDY,
            "SILTY": SoilType.SILTY,
            "LOAMY": SoilType.LOAMY,
            "CHALKY": SoilType.CHALKY,
            "PEATY": SoilType.PEATY,
            "argileux": SoilType.CLAY,
            "sableux": SoilType.SANDY,
            "limoneux": SoilType.SILTY,
            "loameux": SoilType.LOAMY,
            "calcaire": SoilType.CHALKY,
            "tourbeux": SoilType.PEATY,
        }
        
        irrigation_mapping = {
            "DRIP": IrrigationSystem.DRIP,
            "SPRINKLER": IrrigationSystem.SPRINKLER,
            "SURFACE": IrrigationSystem.SURFACE,
            "SUBSURFACE": IrrigationSystem.SUBSURFACE,
            "MANUAL": IrrigationSystem.MANUAL,
            "goutte-à-goutte": IrrigationSystem.DRIP,
            "aspersion": IrrigationSystem.SPRINKLER,
            "gravitaire": IrrigationSystem.SURFACE,
            "subsurface": IrrigationSystem.SUBSURFACE,
            "manuel": IrrigationSystem.MANUAL,
        }
        
        # 3. Mettre à jour chaque ferme
        for farm in farms:
            try:
                # Convertir le type de sol
                soil_value = farm.soil_type.value if hasattr(farm.soil_type, 'value') else str(farm.soil_type)
                farm.soil_type = soil_mapping.get(soil_value.lower(), SoilType.LOAMY)
                
                # Convertir le système d'irrigation
                irrigation_value = farm.irrigation_system.value if hasattr(farm.irrigation_system, 'value') else str(farm.irrigation_system)
                farm.irrigation_system = irrigation_mapping.get(irrigation_value.lower(), IrrigationSystem.DRIP)
                
                print(f"✅ Ferme {farm.name} mise à jour")
            except Exception as e:
                print(f"❌ Erreur pour {farm.name}: {e}")
        
        db.commit()
        print("🎉 Migration terminée avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_farms()