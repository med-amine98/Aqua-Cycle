from google import genai
from google.genai import types
import os
from typing import Optional, Dict, Any
import json
from PIL import Image
import io

class GeminiService:
    """Service utilisant le nouveau SDK Google GenAI"""
    
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash-exp"
        self.vision_model = "gemini-2.0-flash-exp"
    
    def generate_content(self, prompt: str) -> str:
        """Génère du contenu textuel avec Gemini"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Erreur Gemini: {e}")
            return ""
    
    def generate_json_response(self, prompt: str) -> Dict[str, Any]:
        """Génère une réponse JSON structurée"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Erreur Gemini JSON: {e}")
            return {}
    
    def analyze_image(self, image: Image.Image, prompt: str) -> str:
        """Analyse une image avec Gemini Vision"""
        try:
            response = self.client.models.generate_content(
                model=self.vision_model,
                contents=[prompt, image]
            )
            return response.text
        except Exception as e:
            print(f"Erreur Vision: {e}")
            return ""
    
    def chat(self, message: str, context: str = "agriculture") -> str:
        """Chat avec Gemini"""
        try:
            full_prompt = f"""
            Contexte: Vous êtes un expert agricole assistant des agriculteurs.
            Domaine: {context}
            
            Question: {message}
            
            Réponse:"""
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_prompt
            )
            return response.text
        except Exception as e:
            print(f"Erreur Chat: {e}")
            return "Je n'ai pas pu traiter votre question. Veuillez réessayer."

# Instance globale
gemini_service = None

def init_gemini(api_key: str):
    """Initialise le service Gemini"""
    global gemini_service
    if api_key:
        try:
            gemini_service = GeminiService(api_key)
            print("✅ Service Gemini initialisé avec succès")
        except Exception as e:
            print(f"❌ Erreur d'initialisation de Gemini: {e}")
            gemini_service = None
    else:
        print("ℹ️ Clé API Gemini non configurée - Les fonctionnalités IA seront limitées")