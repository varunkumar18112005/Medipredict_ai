import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

os.makedirs("models", exist_ok=True)

PERFORMANCE_REPORT = {}

def evaluate_and_get_best_model(X, y, disease_name):
    print(f"\n=======================================================")
    print(f"   EVALUATING MODELS FOR: {disease_name.upper()}")
    print(f"=======================================================")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = {
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, random_state=42),
        "LogisticRegression": LogisticRegression(max_iter=1000, random_state=42),
        "SVC": SVC(probability=True, random_state=42)
    }
    
    best_model_name = None
    best_model = None
    best_acc = -1.0
    best_metrics = {}
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        probs = model.predict_proba(X_test)
        
        # Calculate evaluation metrics
        acc = accuracy_score(y_test, preds)
        
        # Multi-class or binary handling
        if len(np.unique(y)) > 2:
            prec = precision_score(y_test, preds, average='weighted', zero_division=0)
            rec = recall_score(y_test, preds, average='weighted', zero_division=0)
            f1 = f1_score(y_test, preds, average='weighted', zero_division=0)
            try:
                roc_auc = roc_auc_score(y_test, probs, multi_class='ovr')
            except Exception:
                roc_auc = 0.0
        else:
            prec = precision_score(y_test, preds, zero_division=0)
            rec = recall_score(y_test, preds, zero_division=0)
            f1 = f1_score(y_test, preds, zero_division=0)
            try:
                roc_auc = roc_auc_score(y_test, probs[:, 1])
            except Exception:
                roc_auc = 0.0

        cm = confusion_matrix(y_test, preds).tolist()
        
        print(f"  [{name:18s}] Acc: {acc*100:6.2f}% | F1: {f1:5.3f} | ROC-AUC: {roc_auc:5.3f}")
        
        if acc > best_acc:
            best_acc = acc
            best_model_name = name
            best_model = model
            best_metrics = {
                "model_name": name,
                "accuracy": round(acc * 100, 2),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
                "confusion_matrix": cm,
                "features": list(X.columns)
            }
            
    print(f"--> SELECTED BEST MODEL: [{best_model_name}] with {best_acc*100:.2f}% Accuracy!")
    PERFORMANCE_REPORT[disease_name] = best_metrics
    return best_model

# 1. Diabetes Risk Profiler
def generate_and_train_diabetes():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'glucose': np.random.normal(115, 25, n),
        'hba1c': np.random.normal(6.2, 1.4, n),
        'bloodPressure': np.random.normal(122, 15, n),
        'insulin': np.random.normal(95, 45, n),
        'bmi': np.random.normal(27.5, 5.0, n),
        'age': np.random.randint(20, 80, n)
    })
    risk = (df['glucose'] * 0.35 + df['hba1c'] * 12 + df['bloodPressure'] * 0.1 + df['insulin'] * 0.05 + df['bmi'] * 0.3 + df['age'] * 0.15)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['glucose'] > 140 or r['hba1c'] > 7.5: return 3
        if r['glucose'] > 100 or r['hba1c'] > 6.0: return 1
        if r['bmi'] > 25: return 2
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['glucose', 'hba1c', 'bloodPressure', 'insulin', 'bmi', 'age']]
    m = evaluate_and_get_best_model(X, df['target'], "Diabetes Risk")
    joblib.dump(m, 'models/diabetes_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Diabetes Suggestions")
    joblib.dump(ms, 'models/diabetes_suggestion_model.pkl')

# 2. Cardiovascular Risk Telemetry
def generate_and_train_heart():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'restingBP': np.random.normal(128, 18, n),
        'cholesterol': np.random.normal(215, 38, n),
        'fastingBS': np.random.choice([0, 1], size=n, p=[0.75, 0.25]),
        'restingECG': np.random.choice([0, 1, 2], size=n, p=[0.5, 0.3, 0.2]),
        'maxHeartRate': np.random.normal(145, 22, n),
        'chestPainType': np.random.choice([0, 1, 2, 3], size=n, p=[0.4, 0.3, 0.2, 0.1])
    })
    risk = (df['restingBP'] * 0.25 + df['cholesterol'] * 0.3 + df['fastingBS'] * 15 + df['chestPainType'] * 10 - df['maxHeartRate'] * 0.1)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['restingBP'] > 140 or r['chestPainType'] > 1: return 3
        if r['cholesterol'] > 240: return 2
        if r['fastingBS'] == 1: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['restingBP', 'cholesterol', 'fastingBS', 'restingECG', 'maxHeartRate', 'chestPainType']]
    m = evaluate_and_get_best_model(X, df['target'], "Cardiovascular Risk")
    joblib.dump(m, 'models/heart_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Cardiovascular Suggestions")
    joblib.dump(ms, 'models/heart_suggestion_model.pkl')

# 3. Hepatic Function Diagnostics
def generate_and_train_liver():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'totalBilirubin': np.random.normal(1.1, 0.6, n),
        'directBilirubin': np.random.normal(0.35, 0.2, n),
        'alt': np.random.normal(38, 22, n),
        'ast': np.random.normal(36, 20, n),
        'alp': np.random.normal(110, 35, n),
        'albumin': np.random.normal(4.0, 0.6, n)
    })
    risk = (df['totalBilirubin'] * 12 + df['directBilirubin'] * 20 + df['alt'] * 0.25 + df['ast'] * 0.25 + df['alp'] * 0.1 - df['albumin'] * 10)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['totalBilirubin'] > 1.8 or r['alt'] > 60: return 2
        if r['albumin'] < 3.5: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['totalBilirubin', 'directBilirubin', 'alt', 'ast', 'alp', 'albumin']]
    m = evaluate_and_get_best_model(X, df['target'], "Hepatic Risk")
    joblib.dump(m, 'models/liver_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Hepatic Suggestions")
    joblib.dump(ms, 'models/liver_suggestion_model.pkl')

# 4. Renal Function Clearance
def generate_and_train_kidney():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'serumCreatinine': np.random.normal(1.1, 0.45, n),
        'bloodUrea': np.random.normal(24, 12, n),
        'egfr': np.random.normal(88, 22, n),
        'urineAlbumin': np.random.normal(20, 15, n),
        'haemoglobin': np.random.normal(13.8, 2.1, n),
        'bloodPressure': np.random.normal(124, 16, n)
    })
    risk = (df['serumCreatinine'] * 25 + df['bloodUrea'] * 0.8 + (100 - df['egfr']) * 0.4 + df['urineAlbumin'] * 0.5 - df['haemoglobin'] * 2.0 + df['bloodPressure'] * 0.1)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['serumCreatinine'] > 1.4 or r['egfr'] < 60: return 2
        if r['bloodUrea'] > 30 or r['urineAlbumin'] > 30: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['serumCreatinine', 'bloodUrea', 'egfr', 'urineAlbumin', 'haemoglobin', 'bloodPressure']]
    m = evaluate_and_get_best_model(X, df['target'], "Renal Risk")
    joblib.dump(m, 'models/kidney_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Renal Suggestions")
    joblib.dump(ms, 'models/kidney_suggestion_model.pkl')

# 5. Thyroid Dysfunction Profiler
def generate_and_train_thyroid():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'tsh': np.random.normal(2.8, 1.8, n),
        'freeT3': np.random.normal(2.9, 0.8, n),
        'freeT4': np.random.normal(1.2, 0.4, n),
        'antiTpo': np.random.normal(15, 25, n)
    })
    risk = (abs(df['tsh'] - 2.0) * 10 + abs(df['freeT3'] - 2.8) * 8 + abs(df['freeT4'] - 1.2) * 12 + df['antiTpo'] * 0.3)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['tsh'] > 4.5 or r['antiTpo'] > 35: return 2
        if r['tsh'] < 0.4: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['tsh', 'freeT3', 'freeT4', 'antiTpo']]
    m = evaluate_and_get_best_model(X, df['target'], "Thyroid Risk")
    joblib.dump(m, 'models/thyroid_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Thyroid Suggestions")
    joblib.dump(ms, 'models/thyroid_suggestion_model.pkl')

# 6. Pulmonary Risk Assessment
def generate_and_train_pulmonary():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'oxygenSaturation': np.random.normal(96.5, 2.8, n),
        'fev1': np.random.normal(2.9, 0.7, n),
        'fvc': np.random.normal(3.8, 0.8, n),
        'fev1FvcRatio': np.random.normal(0.76, 0.12, n),
        'respiratoryRate': np.random.normal(16.5, 3.5, n),
        'smokingHistory': np.random.choice([0, 1], size=n, p=[0.65, 0.35])
    })
    risk = ((100 - df['oxygenSaturation']) * 6.0 + (1.0 - df['fev1FvcRatio']) * 35 + (df['respiratoryRate'] - 12) * 1.5 + df['smokingHistory'] * 15 + (4.0 - df['fev1']) * 5)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['oxygenSaturation'] < 92 or r['fev1FvcRatio'] < 0.65: return 2
        if r['smokingHistory'] == 1: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['oxygenSaturation', 'fev1', 'fvc', 'fev1FvcRatio', 'respiratoryRate', 'smokingHistory']]
    m = evaluate_and_get_best_model(X, df['target'], "Pulmonary Risk")
    joblib.dump(m, 'models/pulmonary_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Pulmonary Suggestions")
    joblib.dump(ms, 'models/pulmonary_suggestion_model.pkl')

# 7. Stroke Risk Telemetry
def generate_and_train_stroke():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'bloodPressure': np.random.normal(126, 17, n),
        'glucose': np.random.normal(110, 26, n),
        'cholesterol': np.random.normal(210, 36, n),
        'bmi': np.random.normal(27.0, 4.8, n),
        'age': np.random.randint(30, 88, n),
        'heartDiseaseHistory': np.random.choice([0, 1], size=n, p=[0.8, 0.2])
    })
    risk = (df['bloodPressure'] * 0.25 + df['glucose'] * 0.2 + df['cholesterol'] * 0.15 + df['bmi'] * 0.2 + df['age'] * 0.35 + df['heartDiseaseHistory'] * 20)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['bloodPressure'] > 140 or r['heartDiseaseHistory'] == 1: return 2
        if r['glucose'] > 140 or r['bmi'] > 30: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['bloodPressure', 'glucose', 'cholesterol', 'bmi', 'age', 'heartDiseaseHistory']]
    m = evaluate_and_get_best_model(X, df['target'], "Stroke Risk")
    joblib.dump(m, 'models/stroke_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Stroke Suggestions")
    joblib.dump(ms, 'models/stroke_suggestion_model.pkl')

# 8. Anemia Screening Profiler
def generate_and_train_anemia():
    np.random.seed(42)
    n = 2000
    df = pd.DataFrame({
        'haemoglobin': np.random.normal(13.6, 2.2, n),
        'rbcCount': np.random.normal(4.6, 0.75, n),
        'hematocrit': np.random.normal(41.5, 5.5, n),
        'mcv': np.random.normal(88.0, 8.0, n),
        'mch': np.random.normal(29.0, 3.5, n),
        'ferritin': np.random.normal(105.0, 45.0, n)
    })
    risk = ((16.0 - df['haemoglobin']) * 6.0 + (5.5 - df['rbcCount']) * 8.0 + (48.0 - df['hematocrit']) * 1.5 + (150.0 - df['ferritin']) * 0.15 + abs(df['mcv'] - 88) * 0.5)
    df['target'] = (risk > risk.median()).astype(int)
    
    def assign_sug(r):
        if r['haemoglobin'] < 11.0 or r['ferritin'] < 30.0: return 2
        if r['rbcCount'] < 4.0: return 1
        return 0
    df['suggestion_target'] = df.apply(assign_sug, axis=1)
    
    X = df[['haemoglobin', 'rbcCount', 'hematocrit', 'mcv', 'mch', 'ferritin']]
    m = evaluate_and_get_best_model(X, df['target'], "Anemia Risk")
    joblib.dump(m, 'models/anemia_model.pkl')
    
    ms = evaluate_and_get_best_model(X, df['suggestion_target'], "Anemia Suggestions")
    joblib.dump(ms, 'models/anemia_suggestion_model.pkl')

if __name__ == "__main__":
    print("\n=======================================================")
    print("  RETRAINING ALL 8 DISEASE MODELS WITH EXACT SPECS")
    print("=======================================================")
    generate_and_train_diabetes()
    generate_and_train_heart()
    generate_and_train_liver()
    generate_and_train_kidney()
    generate_and_train_thyroid()
    generate_and_train_pulmonary()
    generate_and_train_stroke()
    generate_and_train_anemia()
    
    print("\n\n=======================================================")
    print("         SUMMARY OF RETRAINED MODEL PERFORMANCE         ")
    print("=======================================================")
    for disease, metrics in PERFORMANCE_REPORT.items():
        print(f"\n[{disease}] Best Model: {metrics['model_name']}")
        print(f"  - Accuracy:  {metrics['accuracy']}%")
        print(f"  - Precision: {metrics['precision']}")
        print(f"  - Recall:    {metrics['recall']}")
        print(f"  - F1 Score:  {metrics['f1_score']}")
        print(f"  - ROC-AUC:   {metrics['roc_auc']}")
        print(f"  - Features:  {metrics['features']}")
        print(f"  - Confusion Matrix: {metrics['confusion_matrix']}")
        
    print("\n[SUCCESS] All 8 disease models retrained and artifacts updated successfully!")
