import sys
from pathlib import Path

# Ajouter le chemin du projet
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
import os

# Importer les modèles UNIQUEMENT après avoir défini Base
from src.models.base import Base
from src.models.user import User
from src.models.farm import Farm
from src.models.plot import Plot
from src.models.water import WaterBudget, WaterRecommendation
from src.models.waste import WasteDeclaration
from src.models.market import CompanyProfile, WasteMatch, Transaction

print("🗄️  Initialisation de la base de données...")

try:
    # Utiliser SQLite directement
    engine = create_engine("sqlite:///./aquacycle.db", connect_args={"check_same_thread": False})
    
    # Créer les tables
    print("🔨 Création des tables...")
    Base.metadata.create_all(engine)
    
    # Vérifier les tables créées
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    if tables:
        print(f"✅ Tables créées: {', '.join(tables)}")
        print("🎉 Base de données initialisée avec succès!")
    else:
        print("❌ Aucune table n'a été créée.")
        print("📋 Vérification des modèles importés:")
        print(f"   User: {User}")
        print(f"   Base: {Base}")
        print(f"   Tables dans metadata: {Base.metadata.tables.keys()}")
        
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()