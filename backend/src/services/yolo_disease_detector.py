"""
YOLO Disease Detector — AquaCycle
Uses YOLOv8 (ultralytics) for real-time object detection and disease localization
in plant/animal images. Falls back gracefully when ultralytics is not installed.
"""

import io
import os
import logging
import tempfile
from typing import Dict, Any, List, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Disease label → display mapping
YOLO_DISEASE_LABELS = {
    "leaf_blight": {"fr": "Brûlure des feuilles", "severity": "high", "color": "#FF4444"},
    "powdery_mildew": {"fr": "Oïdium", "severity": "medium", "color": "#FFA500"},
    "rust": {"fr": "Rouille", "severity": "high", "color": "#CC4400"},
    "leaf_spot": {"fr": "Taches foliaires", "severity": "medium", "color": "#FF8800"},
    "mosaic_virus": {"fr": "Virus de la mosaïque", "severity": "high", "color": "#CC0000"},
    "anthracnose": {"fr": "Anthracnose", "severity": "high", "color": "#880000"},
    "healthy": {"fr": "Saine", "severity": "none", "color": "#00CC44"},
    "unknown": {"fr": "Indéterminé", "severity": "medium", "color": "#888888"},
}

# Default YOLO model weights (nano = fastest, works on CPU)
YOLO_MODEL_NAME = "yolov8n.pt"  # Falls back to this if no custom weights found
CUSTOM_WEIGHTS = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml_models", "yolo_plant_disease.pt"
)


class YOLODiseaseDetector:
    """
    YOLOv8-based disease detector for localization + classification.
    If ultralytics is not installed, returns structured simulated detections.
    """

    def __init__(self):
        self._model = None
        self._available = self._try_load()

    def _try_load(self) -> bool:
        try:
            from ultralytics import YOLO

            if os.path.exists(CUSTOM_WEIGHTS):
                self._model = YOLO(CUSTOM_WEIGHTS)
                logger.info(f"[YOLO] Loaded custom weights: {CUSTOM_WEIGHTS}")
            else:
                # Use YOLOv8n pretrained on COCO; we'll use it in feature-detection mode
                self._model = YOLO(YOLO_MODEL_NAME)
                logger.warning("[YOLO] No custom disease weights — using YOLOv8n COCO (general detection mode).")
            return True
        except ImportError:
            logger.warning("[YOLO] ultralytics not installed — using structured simulation.")
            return False
        except Exception as exc:
            logger.error(f"[YOLO] Load error: {exc}")
            return False

    def _run_yolo(self, img: Image.Image) -> Dict[str, Any]:
        """Run YOLOv8 inference and format results."""
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name

        try:
            results = self._model.predict(source=tmp_path, conf=0.25, verbose=False)
        finally:
            os.unlink(tmp_path)

        detections = []
        if results and len(results) > 0:
            result = results[0]
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].tolist()

                    # Map YOLO class name to disease label
                    class_name = result.names.get(cls_id, "unknown")
                    disease_info = YOLO_DISEASE_LABELS.get(
                        class_name, YOLO_DISEASE_LABELS["unknown"]
                    )

                    detections.append({
                        "class_id": cls_id,
                        "class_name": class_name,
                        "label_fr": disease_info["fr"],
                        "confidence": round(conf * 100, 1),
                        "severity": disease_info["severity"],
                        "color": disease_info["color"],
                        "bbox": {
                            "x1": round(xyxy[0], 1),
                            "y1": round(xyxy[1], 1),
                            "x2": round(xyxy[2], 1),
                            "y2": round(xyxy[3], 1),
                        }
                    })

        # Determine overall health
        if not detections:
            overall = "sain"
            overall_confidence = 85.0
        else:
            # Highest severity wins
            sev_order = {"critical": 4, "high": 3, "medium": 2, "low": 1, "none": 0}
            worst = max(detections, key=lambda d: sev_order.get(d["severity"], 0))
            overall = "malade" if worst["severity"] != "none" else "sain"
            overall_confidence = worst["confidence"]

        return {
            "model": "YOLOv8",
            "detections": detections,
            "detection_count": len(detections),
            "health_status": overall,
            "overall_confidence": overall_confidence,
            "image_size": {"width": img.width, "height": img.height},
            "status": "success"
        }

    def _simulation_predict(self, img: Image.Image) -> Dict[str, Any]:
        """
        Structured simulation when ultralytics is not available.
        Uses color analysis for rough heuristic, returns bounding box annotations.
        """
        img_rgb = img.convert("RGB").resize((224, 224))
        pixels = list(img_rgb.getdata())
        avg_g = sum(p[1] for p in pixels) / len(pixels)
        avg_r = sum(p[0] for p in pixels) / len(pixels)

        w, h = img.width, img.height

        if avg_g > 100 and avg_g > avg_r * 1.1:
            detections = []
            health_status = "sain"
            confidence = 78.0
        else:
            # Simulate a disease detection in center region
            detections = [{
                "class_id": 0,
                "class_name": "leaf_spot",
                "label_fr": "Taches foliaires (simulation)",
                "confidence": 62.0,
                "severity": "medium",
                "color": "#FF8800",
                "bbox": {
                    "x1": round(w * 0.3, 1),
                    "y1": round(h * 0.3, 1),
                    "x2": round(w * 0.7, 1),
                    "y2": round(h * 0.7, 1),
                }
            }]
            health_status = "legerement_malade"
            confidence = 62.0

        return {
            "model": "YOLOv8 (simulation — ultralytics non installé)",
            "detections": detections,
            "detection_count": len(detections),
            "health_status": health_status,
            "overall_confidence": confidence,
            "image_size": {"width": img.width, "height": img.height},
            "status": "success",
            "warning": "ultralytics non installé — résultat simulé basé sur analyse couleur."
        }

    async def detect(self, image_data: bytes, analysis_type: str = "plant") -> Dict[str, Any]:
        """
        Main entry point for YOLO disease detection.
        Returns detections with bounding boxes for overlay rendering.
        """
        try:
            img = Image.open(io.BytesIO(image_data))

            if self._available and self._model is not None:
                result = self._run_yolo(img)
            else:
                result = self._simulation_predict(img)

            result["analysis_type"] = analysis_type
            return result

        except Exception as exc:
            logger.error(f"[YOLO] detect error: {exc}")
            return {
                "status": "error",
                "message": str(exc),
                "model": "YOLOv8",
                "detections": [],
                "detection_count": 0,
                "confidence": 0
            }


# Singleton
yolo_detector = YOLODiseaseDetector()
