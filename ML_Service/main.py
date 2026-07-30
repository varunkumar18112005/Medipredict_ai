from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
import os
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import io
import re
from fastapi import File, UploadFile
import chat_advisor

app = FastAPI(title="MediPredict ML Microservice", version="1.0")

class ChatRequest(BaseModel):
    message: str
    vitals: Optional[dict] = {}
    diseaseType: Optional[str] = None


MODELS = {}
SUGGESTIONS_MODELS = {}

from recommendation_model import RecommendationEngine

# Initialize the data-driven recommendation engine
recommendation_engine = RecommendationEngine(dataset_path="disease_recommendations_dataset.json")

def load_models():
    model_files = {
        'DIABETES': 'models/diabetes_model.pkl',
        'HEART_DISEASE': 'models/heart_model.pkl',
        'LIVER_DISEASE': 'models/liver_model.pkl',
        'KIDNEY_DISEASE': 'models/kidney_model.pkl',
        'THYROID_DISEASE': 'models/thyroid_model.pkl',
        'PULMONARY_DISEASE': 'models/pulmonary_model.pkl',
        'STROKE': 'models/stroke_model.pkl',
        'ANEMIA': 'models/anemia_model.pkl'
    }
    sug_model_files = {
        'DIABETES': 'models/diabetes_suggestion_model.pkl',
        'HEART_DISEASE': 'models/heart_suggestion_model.pkl',
        'LIVER_DISEASE': 'models/liver_suggestion_model.pkl',
        'KIDNEY_DISEASE': 'models/kidney_suggestion_model.pkl',
        'THYROID_DISEASE': 'models/thyroid_suggestion_model.pkl',
        'PULMONARY_DISEASE': 'models/pulmonary_suggestion_model.pkl',
        'STROKE': 'models/stroke_suggestion_model.pkl',
        'ANEMIA': 'models/anemia_suggestion_model.pkl'
    }
    for disease, path in model_files.items():
        if os.path.exists(path):
            MODELS[disease] = joblib.load(path)
            print(f"Loaded {disease} predicting model.")
    for disease, path in sug_model_files.items():
        if os.path.exists(path):
            SUGGESTIONS_MODELS[disease] = joblib.load(path)
            print(f"Loaded {disease} suggestion recommendation model.")

load_models()

class AssessmentRequest(BaseModel):
    diseaseType: str
    userName: Optional[str] = None

    # 1. Diabetes
    glucose: Optional[float] = 100.0
    hba1c: Optional[float] = 5.5
    bloodPressure: Optional[float] = 120.0
    insulin: Optional[float] = 15.0
    bmi: Optional[float] = 25.0
    age: Optional[int] = 40

    # 2. Cardiovascular
    restingBP: Optional[float] = 120.0
    cholesterol: Optional[float] = 180.0
    fastingBS: Optional[int] = 0
    restingECG: Optional[int] = 0
    maxHeartRate: Optional[int] = 150
    chestPainType: Optional[int] = 0

    # 3. Hepatic
    totalBilirubin: Optional[float] = 1.0
    directBilirubin: Optional[float] = 0.3
    alt: Optional[float] = 30.0
    ast: Optional[float] = 30.0
    alp: Optional[float] = 100.0
    albumin: Optional[float] = 4.0

    # 4. Renal
    serumCreatinine: Optional[float] = 1.0
    bloodUrea: Optional[float] = 20.0
    egfr: Optional[float] = 90.0
    urineAlbumin: Optional[float] = 15.0
    haemoglobin: Optional[float] = 14.0

    # 5. Thyroid
    tsh: Optional[float] = 2.5
    freeT3: Optional[float] = 1.2
    freeT4: Optional[float] = 1.1
    antiTpo: Optional[float] = 10.0

    # 6. Pulmonary
    oxygenSaturation: Optional[float] = 97.0
    fev1: Optional[float] = 3.0
    fvc: Optional[float] = 4.0
    fev1FvcRatio: Optional[float] = 0.75
    respiratoryRate: Optional[int] = 16
    smokingHistory: Optional[int] = 0

    # 7. Stroke
    heartDiseaseHistory: Optional[int] = 0

    # 8. Anemia
    rbcCount: Optional[float] = 4.5
    hematocrit: Optional[float] = 42.0
    mcv: Optional[float] = 88.0
    mch: Optional[float] = 29.0
    ferritin: Optional[float] = 100.0

@app.post("/predict")
def predict_risk(req: AssessmentRequest):
    dtype = req.diseaseType.upper()
    if dtype not in MODELS:
        raise HTTPException(status_code=400, detail=f"Model for {dtype} is not available.")

    model = MODELS[dtype]

    if dtype == 'DIABETES':
        df = pd.DataFrame([{
            'glucose': req.glucose, 
            'hba1c': req.hba1c,
            'bloodPressure': req.bloodPressure,
            'insulin': req.insulin,
            'bmi': req.bmi, 
            'age': req.age
        }])
    elif dtype == 'HEART_DISEASE':
        df = pd.DataFrame([{
            'restingBP': req.restingBP,
            'cholesterol': req.cholesterol,
            'fastingBS': req.fastingBS,
            'restingECG': req.restingECG,
            'maxHeartRate': req.maxHeartRate,
            'chestPainType': req.chestPainType
        }])
    elif dtype == 'LIVER_DISEASE':
        df = pd.DataFrame([{
            'totalBilirubin': req.totalBilirubin,
            'directBilirubin': req.directBilirubin,
            'alt': req.alt,
            'ast': req.ast,
            'alp': req.alp,
            'albumin': req.albumin
        }])
    elif dtype == 'KIDNEY_DISEASE':
        df = pd.DataFrame([{
            'serumCreatinine': req.serumCreatinine,
            'bloodUrea': req.bloodUrea,
            'egfr': req.egfr,
            'urineAlbumin': req.urineAlbumin,
            'haemoglobin': req.haemoglobin,
            'bloodPressure': req.bloodPressure
        }])
    elif dtype == 'THYROID_DISEASE':
        df = pd.DataFrame([{
            'tsh': req.tsh,
            'freeT3': req.freeT3,
            'freeT4': req.freeT4,
            'antiTpo': req.antiTpo
        }])
    elif dtype == 'PULMONARY_DISEASE':
        df = pd.DataFrame([{
            'oxygenSaturation': req.oxygenSaturation,
            'fev1': req.fev1,
            'fvc': req.fvc,
            'fev1FvcRatio': req.fev1FvcRatio,
            'respiratoryRate': req.respiratoryRate,
            'smokingHistory': req.smokingHistory
        }])
    elif dtype == 'STROKE':
        df = pd.DataFrame([{
            'bloodPressure': req.bloodPressure,
            'glucose': req.glucose,
            'cholesterol': req.cholesterol,
            'bmi': req.bmi,
            'age': req.age,
            'heartDiseaseHistory': req.heartDiseaseHistory
        }])
    elif dtype == 'ANEMIA':
        df = pd.DataFrame([{
            'haemoglobin': req.haemoglobin,
            'rbcCount': req.rbcCount,
            'hematocrit': req.hematocrit,
            'mcv': req.mcv,
            'mch': req.mch,
            'ferritin': req.ferritin
        }])

    prob = model.predict_proba(df)[0][1]

    sugg_model = SUGGESTIONS_MODELS.get(dtype)
    sugg_class = 0
    if sugg_model:
        sugg_class = int(sugg_model.predict(df)[0])

    # Fetch recommendations from the data-driven engine
    full_recommendations = recommendation_engine.get_full_recommendation(dtype, sugg_class, req.userName)
    suggestion_list = recommendation_engine.get_summary_suggestions(dtype, sugg_class, req.userName)

    risk_score = round(float(prob * 100), 2)

    return {
        "diseaseType": dtype, 
        "riskScore": risk_score, 
        "suggestions": suggestion_list,
        "recommendations": full_recommendations
    }


@app.post("/extract")
async def extract_document_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = ""

        filename_lower = file.filename.lower() if file.filename else ""
        if filename_lower.endswith(".pdf") or file.content_type == "application/pdf":
            try:
                # Try OCR via pdf2image & pytesseract
                images = convert_from_bytes(content)
                for img in images:
                    extracted_text += pytesseract.image_to_string(img) + "\n"
            except Exception as ocr_err:
                print(f"OCR pdf conversion error: {ocr_err}")
                extracted_text = content.decode('utf-8', errors='ignore')
        else:
            try:
                img = Image.open(io.BytesIO(content))
                extracted_text = pytesseract.image_to_string(img)
            except Exception as img_err:
                print(f"OCR image error: {img_err}")
                extracted_text = content.decode('utf-8', errors='ignore')

        text_lower = extracted_text.lower()
        parsed_data = {}

        def extract_val(pattern):
            match = re.search(pattern, text_lower)
            if match:
                try:
                    return float(match.group(1))
                except Exception:
                    pass
            return None

        # ── 1. Diabetes Standardized Fields ──────────────────────────────────────
        parsed_data['glucose'] = (
            extract_val(r'fasting\s*(?:blood\s*)?glucose[^0-9]{0,20}(\d+(?:\.\d+)?)') or
            extract_val(r'blood\s*glucose[^0-9]{0,20}(\d+(?:\.\d+)?)') or
            extract_val(r'fbs[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'glucose[^0-9]{0,20}(\d+(?:\.\d+)?)')
        )
        parsed_data['hba1c'] = (
            extract_val(r'hba1c[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'glycated\s*h(?:a)?emoglobin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'a1c[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['bloodPressure'] = (
            extract_val(r'blood\s*pressure[^0-9]{0,15}(\d{2,3})') or
            extract_val(r'systolic[^0-9]{0,15}(\d{2,3})') or
            extract_val(r'\bbp\b[^0-9]{0,10}(\d{2,3})')
        )
        parsed_data['insulin'] = (
            extract_val(r'fasting\s*insulin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'insulin[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['bmi'] = extract_val(r'bmi[^0-9]{0,10}(\d+(?:\.\d+)?)') or extract_val(r'body\s*mass\s*index[^0-9]{0,10}(\d+(?:\.\d+)?)')
        parsed_data['age'] = extract_val(r'age[^0-9]{0,10}(\d+)')

        # ── 2. Cardiovascular Standardized Fields ───────────────────────────────
        parsed_data['restingBP'] = (
            extract_val(r'resting\s*(?:blood\s*pressure|bp)[^0-9]{0,15}(\d{2,3})') or
            extract_val(r'blood\s*pressure[^0-9]{0,15}(\d{2,3})') or
            extract_val(r'systolic[^0-9]{0,15}(\d{2,3})')
        )
        parsed_data['cholesterol'] = (
            extract_val(r'total\s*cholesterol[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'serum\s*cholesterol[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'cholesterol[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['fastingBS'] = (
            1.0 if (parsed_data['glucose'] and parsed_data['glucose'] > 120) else
            extract_val(r'fasting\s*blood\s*sugar[^0-9]{0,10}(\d+)')
        )
        parsed_data['restingECG'] = extract_val(r'resting\s*ecg[^0-9]{0,10}(\d+)') or extract_val(r'\becg\b[^0-9]{0,10}(\d+)')
        parsed_data['maxHeartRate'] = (
            extract_val(r'max\s*heart\s*rate[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'heart\s*rate[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'pulse[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['chestPainType'] = extract_val(r'chest\s*pain\s*type[^0-9]{0,10}(\d+)')

        # ── 3. Hepatic Standardized Fields ──────────────────────────────────────
        parsed_data['totalBilirubin'] = (
            extract_val(r'total\s*bilirubin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r't\.?\s*bilirubin[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['directBilirubin'] = (
            extract_val(r'direct\s*bilirubin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'd\.?\s*bilirubin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'conjugated\s*bilirubin[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['alt'] = (
            extract_val(r'(?:alanine\s*(?:amino|transaminase)|alat|sgpt|alt\s*[:\-/])[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\balt\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['ast'] = (
            extract_val(r'(?:aspartate\s*(?:amino|transaminase)|asat|sgot|ast\s*[:\-/])[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\bast\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['alp'] = (
            extract_val(r'alkaline\s*phosph(?:at|ot)ase[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\balp\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['albumin'] = (
            extract_val(r'serum\s*albumin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'albumin[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )

        # ── 4. Renal Standardized Fields ─────────────────────────────────────────
        parsed_data['serumCreatinine'] = (
            extract_val(r'serum\s*creatinine[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'creatinine[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['bloodUrea'] = (
            extract_val(r'blood\s*urea\s*nitrogen[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'blood\s*urea[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bbun\b[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\burea\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['egfr'] = (
            extract_val(r'estimated\s*gfr[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'egfr[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\bgfr\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['urineAlbumin'] = (
            extract_val(r'urine\s*albumin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'microalbumin[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['haemoglobin'] = (
            extract_val(r'h(?:a)?emoglobin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bhb\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )

        # ── 5. Thyroid Standardized Fields ───────────────────────────────────────
        parsed_data['tsh'] = (
            extract_val(r'thyroid\s*stimulating\s*hormone[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\btsh\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['freeT3'] = (
            extract_val(r'free\s*t3[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\bft3\b[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'triiodothyronine[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['freeT4'] = (
            extract_val(r'free\s*t4[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'\bft4\b[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'thyroxine[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['antiTpo'] = (
            extract_val(r'anti-tpo[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'tpo\s*antibodies[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'thyroid\s*peroxidase[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )

        # ── 6. Pulmonary Standardized Fields ─────────────────────────────────────
        parsed_data['oxygenSaturation'] = (
            extract_val(r'oxygen\s*saturation[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bspo2\b[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'o2\s*sat[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['fev1'] = (
            extract_val(r'forced\s*expiratory\s*volume[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bfev1\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['fvc'] = (
            extract_val(r'forced\s*vital\s*capacity[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bfvc\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['fev1FvcRatio'] = (
            extract_val(r'fev1/fvc[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'fev1\s*fvc\s*ratio[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['respiratoryRate'] = (
            extract_val(r'respiratory\s*rate[^0-9]{0,15}(\d+)') or
            extract_val(r'resp\s*rate[^0-9]{0,15}(\d+)')
        )
        parsed_data['smokingHistory'] = extract_val(r'smok(?:er|ing)[^0-9]{0,10}(\d+)')

        # ── 7. Stroke Standardized Fields ───────────────────────────────────────
        parsed_data['heartDiseaseHistory'] = extract_val(r'heart\s*disease\s*history[^0-9]{0,10}(\d+)')

        # ── 8. Anemia Standardized Fields ───────────────────────────────────────
        parsed_data['rbcCount'] = (
            extract_val(r'red\s*blood\s*cell[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'rbc\s*count[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\brbc\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['hematocrit'] = (
            extract_val(r'hematocrit[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bhct\b[^0-9]{0,10}(\d+(?:\.\d+)?)') or
            extract_val(r'packed\s*cell\s*volume[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )
        parsed_data['mcv'] = (
            extract_val(r'mean\s*corpuscular\s*volume[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bmcv\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['mch'] = (
            extract_val(r'mean\s*corpuscular\s*h(?:a)?emoglobin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'\bmch\b[^0-9]{0,10}(\d+(?:\.\d+)?)')
        )
        parsed_data['ferritin'] = (
            extract_val(r'serum\s*ferritin[^0-9]{0,15}(\d+(?:\.\d+)?)') or
            extract_val(r'ferritin[^0-9]{0,15}(\d+(?:\.\d+)?)')
        )

        clean_data = {k: v for k, v in parsed_data.items() if v is not None}
        return clean_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        reply = chat_advisor.respond_to_query(req.message, req.vitals, req.diseaseType)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))