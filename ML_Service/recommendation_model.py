import json
import os
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    def __init__(self, dataset_path="disease_recommendations_dataset.json"):
        """
        Initializes the recommendation engine by loading the JSON dataset.
        """
        self.dataset_path = dataset_path
        self.recommendations = {}
        self._load_dataset()

    def _load_dataset(self):
        if not os.path.exists(self.dataset_path):
            logger.error(f"Dataset not found at {self.dataset_path}")
            return
        
        try:
            with open(self.dataset_path, 'r', encoding='utf-8') as f:
                self.recommendations = json.load(f)
            logger.info("Successfully loaded disease recommendations dataset.")
        except Exception as e:
            logger.error(f"Failed to load recommendations dataset: {e}")

    def get_full_recommendation(self, disease_name: str, severity_level: int, user_name: str = None) -> dict:
        """
        Retrieves the complete structured recommendation dictionary for a given disease and severity level.
        Includes a standard medical disclaimer.
        """
        disease = disease_name.upper()
        severity = str(severity_level)
        
        # Fallback handling
        if disease not in self.recommendations:
            logger.warning(f"No recommendations found for disease: {disease}")
            return self._default_recommendation()
        
        # If the exact severity isn't found, default to the lowest severity or the highest available
        if severity not in self.recommendations[disease]:
            available_levels = list(self.recommendations[disease].keys())
            if available_levels:
                severity = available_levels[-1]  # Default to max available or implement fallback
                logger.warning(f"Severity level {severity_level} not found for {disease}, falling back to {severity}")
            else:
                return self._default_recommendation()
            
        data = self.recommendations[disease][severity].copy()
        data["disclaimer"] = "These recommendations are computationally generated and are for informational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment."
        return data

    def get_summary_suggestions(self, disease_name: str, severity_level: int, user_name: str = None) -> list:
        """
        Returns a flattened list of suggestion strings suitable for simple UIs.
        Combines diet, lifestyle, and preventive measures.
        """
        rec = self.get_full_recommendation(disease_name, severity_level)
        if "level" not in rec:
            return ["Maintain a healthy lifestyle and consult a physician."]
        
        suggestions = []
        if user_name:
            suggestions.append(f"Hello {user_name}, here is your health summary:")
            
        suggestions.append(f"Risk Level Assessed: {rec.get('level', 'Unknown')}")
        suggestions.extend(rec.get("diet_suggestions", []))
        suggestions.extend(rec.get("lifestyle_changes", []))
        suggestions.extend(rec.get("preventive_measures", []))
        
        # If critical, prepend emergency warnings
        if severity_level >= 2 and "emergency_warnings" in rec:
            warnings = ", ".join(rec["emergency_warnings"])
            suggestions.insert(1, f"WARNING SIGNS: Watch out for {warnings}.")
            
        return suggestions

    def get_diet_plan(self, disease_name: str, severity_level: int) -> list:
        rec = self.get_full_recommendation(disease_name, severity_level)
        return rec.get("diet_suggestions", [])

    def get_lifestyle_advice(self, disease_name: str, severity_level: int) -> list:
        rec = self.get_full_recommendation(disease_name, severity_level)
        return rec.get("lifestyle_changes", [])

    def get_emergency_warnings(self, disease_name: str, severity_level: int) -> list:
        rec = self.get_full_recommendation(disease_name, severity_level)
        return rec.get("emergency_warnings", [])

    def _default_recommendation(self) -> dict:
        return {
            "level": "Unknown",
            "symptoms": [],
            "recommended_tests": [],
            "medications": [],
            "diet_suggestions": ["Maintain a balanced diet."],
            "lifestyle_changes": ["Engage in regular physical activity."],
            "preventive_measures": ["Routine medical checkups."],
            "follow_up": ["Consult a primary care physician."],
            "emergency_warnings": ["Seek immediate care for severe or sudden symptoms."],
            "disclaimer": "These recommendations are computationally generated and are for informational purposes only. They are not a substitute for professional medical advice, diagnosis, or treatment."
        }
