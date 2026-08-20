import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from src.database import SessionLocal
from src.models.water import WaterBudget
from datetime import datetime, date

def fix_water_data():
    db = SessionLocal()
    try:
        # Récupérer toutes les données d'eau
        water_data = db.query(WaterBudget).all()
        print(f"📊 {len(water_data)} enregistrements d'eau trouvés")
        
        for data in water_data:
            # Vérifier si la date est valide
            if data.month is None:
                print(f"❌ Date manquante pour ID: {data.id}")
                # Mettre une date par défaut (aujourd'hui)
                data.month = date.today()
                print(f"✅ Date mise à jour: {data.month}")
            else:
                try:
                    # Vérifier si la date est valide
                    if isinstance(data.month, str):
                        date_obj = datetime.strptime(data.month, "%Y-%m-%d").date()
                        data.month = date_obj
                    print(f"✅ Date valide pour ID: {data.id} -> {data.month}")
                except Exception as e:
                    print(f"❌ Date invalide pour ID: {data.id} -> {data.month}")
                    data.month = date.today()
                    print(f"✅ Date mise à jour: {data.month}")
        
        db.commit()
        print("🎉 Données d'eau corrigées avec succès!")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_water_data()