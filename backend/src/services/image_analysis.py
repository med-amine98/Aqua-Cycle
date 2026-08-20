import base64
import io
from PIL import Image
import google.generativeai as genai
from typing import Dict, Any
import os
import json
import re
import asyncio

# Optional CNN + YOLO integration
try:
    from .cnn_disease_detector import cnn_detector as _cnn
    from .yolo_disease_detector import yolo_detector as _yolo
    _ML_AVAILABLE = True
except Exception:
    _cnn = None
    _yolo = None
    _ML_AVAILABLE = False


class ImageAnalysisService:
    """Service d'analyse d'images avec Gemini AI pour la santé des plantes et animaux"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.vision_model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
            self.vision_model = None
    
    async def analyze_plant_health(self, image_data: bytes) -> Dict[str, Any]:
        """Analyse la santé d'une plante à partir d'une image"""
        if not self.model:
            return {
                "status": "error",
                "message": "Service d'IA non disponible. Veuillez configurer GEMINI_API_KEY.",
                "health_status": "analyse_non_disponible",
                "confidence": 0
            }
        
        try:
            img = Image.open(io.BytesIO(image_data))
            
            prompt = """
            Vous êtes un expert en phytopathologie. Analysez cette image de plante agricole et fournissez un diagnostic détaillé en JSON.
            
            Analysez attentivement:
            1. Les feuilles (couleur, taches, déformations)
            2. La tige (couleur, structure)
            3. Les fruits/fleurs si présents
            4. L'état général de la plante
            
            Répondez UNIQUEMENT au format JSON suivant:
            {
                "plant_type": "type de plante identifié",
                "health_status": "sain | legerement_malade | malade | critique",
                "disease_name": "nom de la maladie détectée (si applicable, sinon null)",
                "disease_description": "description de la maladie",
                "confidence": 85,
                "symptoms": ["symptôme 1", "symptôme 2"],
                "severity": "faible | moyenne | élevée",
                "treatment": "traitement recommandé détaillé",
                "prevention": "mesures préventives",
                "urgency": "faible | moyenne | élevée",
                "water_need": "normal | élevé | réduit",
                "fertilizer_need": "normal | élevé | réduit",
                "recommendations": ["recommandation 1", "recommandation 2"],
                "estimated_recovery_time": "temps estimé de récupération"
            }
            """
            
            response = self.vision_model.generate_content([prompt, img])
            text = response.text
            
            # Extraire le JSON de la réponse
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    result["status"] = "success"
                    return result
                except:
                    pass
            
            return {
                "status": "success",
                "analysis": text,
                "health_status": "analyse_terminee",
                "confidence": 70
            }
                
        except Exception as e:
            print(f"Erreur analyse plante: {e}")
            return {
                "status": "error",
                "message": str(e),
                "health_status": "erreur",
                "confidence": 0
            }
    
    async def analyze_animal_health(self, image_data: bytes) -> Dict[str, Any]:
        """Analyse la santé d'un animal à partir d'une image"""
        if not self.model:
            return {
                "status": "error",
                "message": "Service d'IA non disponible. Veuillez configurer GEMINI_API_KEY.",
                "health_status": "analyse_non_disponible",
                "confidence": 0
            }
        
        try:
            img = Image.open(io.BytesIO(image_data))
            
            prompt = """
            Vous êtes un vétérinaire expert. Analysez cette image d'animal d'élevage et fournissez un diagnostic détaillé en JSON.
            
            Analysez attentivement:
            1. L'état général de l'animal (posture, comportement)
            2. Le pelage/plumage (état, brillance)
            3. Les yeux (clarté, signes de maladie)
            4. La condition corporelle (maigreur, gonflement)
            5. Tout signe anormal (blessures, excroissances)
            
            Répondez UNIQUEMENT au format JSON suivant:
            {
                "animal_type": "type d'animal identifié",
                "breed": "race identifiée (si possible)",
                "health_status": "excellent | bon | moyen | critique",
                "condition": "bonne | moyenne | mauvaise",
                "weight_estimate": 250,
                "body_condition_score": 3,
                "abnormalities": ["anomalie 1", "anomalie 2"],
                "symptoms": ["symptôme 1", "symptôme 2"],
                "disease_name": "nom de la maladie suspectée (si applicable)",
                "confidence": 85,
                "recommendations": ["recommandation 1", "recommandation 2"],
                "urgency": "faible | moyenne | élevée",
                "veterinary_care": "soins vétérinaires recommandés",
                "nutrition_need": "besoin nutritionnel estimé",
                "estimated_age": "âge estimé",
                "treatment": "traitement recommandé"
            }
            """
            
            response = self.vision_model.generate_content([prompt, img])
            text = response.text
            
            # Extraire le JSON de la réponse
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    result["status"] = "success"
                    return result
                except:
                    pass
            
            return {
                "status": "success",
                "analysis": text,
                "health_status": "analyse_terminee",
                "confidence": 70
            }
                
        except Exception as e:
            print(f"Erreur analyse animal: {e}")
            return {
                "status": "error",
                "message": str(e),
                "health_status": "erreur",
                "confidence": 0
            }

    async def combined_analysis(self, image_data: bytes, analysis_type: str = "plant") -> Dict[str, Any]:
        """
        Analyse combinée Gemini + CNN + YOLO.
        Lance les 3 modèles en parallèle et fusionne les résultats.
        """
        tasks = []

        # Gemini analysis
        if analysis_type == "plant":
            gemini_task = self.analyze_plant_health(image_data)
        else:
            gemini_task = self.analyze_animal_health(image_data)
        tasks.append(gemini_task)

        # CNN analysis
        if _ML_AVAILABLE and _cnn:
            tasks.append(_cnn.analyze(image_data, analysis_type))
        else:
            tasks.append(asyncio.coroutine(lambda: {"status": "unavailable"})())

        # YOLO analysis
        if _ML_AVAILABLE and _yolo:
            tasks.append(_yolo.detect(image_data, analysis_type))
        else:
            tasks.append(asyncio.coroutine(lambda: {"status": "unavailable"})())

        results = await asyncio.gather(*tasks, return_exceptions=True)
        gemini_r = results[0] if not isinstance(results[0], Exception) else {"status": "error"}
        cnn_r = results[1] if not isinstance(results[1], Exception) else {"status": "error"}
        yolo_r = results[2] if not isinstance(results[2], Exception) else {"status": "error"}

        # Compute merged confidence
        confs = [
            c for c in [
                gemini_r.get("confidence", 0),
                cnn_r.get("confidence", 0),
                yolo_r.get("overall_confidence", 0),
            ] if c and c > 0
        ]
        merged_conf = round(sum(confs) / len(confs), 1) if confs else 0

        # Consensus health status
        statuses = [
            gemini_r.get("health_status", ""),
            cnn_r.get("health_status", ""),
            yolo_r.get("health_status", ""),
        ]
        if any("critique" in s or "critical" in s for s in statuses):
            consensus = "critique"
        elif any("malade" in s for s in statuses) and "sain" not in statuses:
            consensus = "malade"
        elif any("legerement" in s for s in statuses):
            consensus = "legerement_malade"
        else:
            consensus = "sain"

        return {
            "status": "success",
            "analysis_type": analysis_type,
            "consensus": {
                "health_status": consensus,
                "merged_confidence": merged_conf,
                "disease_name": gemini_r.get("disease_name") or cnn_r.get("disease_name", "Inconnu"),
                "severity": gemini_r.get("severity") or cnn_r.get("severity", "unknown"),
                "treatment": gemini_r.get("treatment", ""),
                "bounding_boxes": yolo_r.get("detections", []),
                "detection_count": yolo_r.get("detection_count", 0),
            },
            "gemini": gemini_r,
            "cnn": cnn_r,
            "yolo": yolo_r,
        }