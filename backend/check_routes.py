from main import app

print("📋 Routes disponibles:")
for route in app.routes:
    if hasattr(route, 'path'):
        methods = ", ".join(route.methods) if hasattr(route, 'methods') else "ALL"
        print(f"  {methods} {route.path}")