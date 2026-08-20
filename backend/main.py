from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database import engine, Base
from src.api.routes import auth, farms, notifications, animals, transactions, waste, water, health_analysis, profile, ai_models, iot_sustainability, integration
from src.services.gemini_service import init_gemini
from src.config import settings

# Initialiser Gemini (optionnel)
try:
    init_gemini(settings.GEMINI_API_KEY)
except:
    print("⚠️ Gemini non initialisé")

# Créer les tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AquaCycle API",
    description="Plateforme de gestion d'eau et d'agriculture circulaire",
    version="1.0.0"
)

# CORS - Autoriser toutes les origines en développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ ROUTES ============
app.include_router(auth.router)              # /auth
app.include_router(farms.router)             # /farms
app.include_router(notifications.router)     # /notifications
app.include_router(animals.router)           # /animals
app.include_router(transactions.router)      # /transactions
app.include_router(waste.router)             # /waste
app.include_router(water.router)             # /water
app.include_router(health_analysis.router)   # /health
app.include_router(profile.router)           # /auth/profile
app.include_router(ai_models.router)         # /ai/models (CNN, YOLO, RF, Atmosphere)
app.include_router(iot_sustainability.router) # /iot-sustainability (IoT, Carbon Credits, ESG)
app.include_router(integration.router)          # /integration (Pipeline intégré: Health Score, Alertes, Recommandations)

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur AquaCycle API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running",
        "routes": [
            "/auth",
            "/farms",
            "/notifications",
            "/animals",
            "/transactions",
            "/waste",
            "/water",
            "/health",
            "/ai/gemini",
            "/ai/models (CNN · YOLO · RandomForest · Atmosphere)"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/routes")
async def list_routes():
    """Liste toutes les routes disponibles"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = ", ".join(route.methods) if hasattr(route, 'methods') else "ALL"
            routes.append(f"{methods} {route.path}")
    return {"routes": routes}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["src"]
    )