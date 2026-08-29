from main import app

print("📋 Routes disponibles:")
for route in app.routes:
    path = getattr(route, 'path', None)
    if path:
        raw_methods = getattr(route, 'methods', None)
        methods = ", ".join(raw_methods) if raw_methods else "ALL"
        print(f"  {methods} {path}")