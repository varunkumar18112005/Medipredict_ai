import re
import urllib.request
import json
import os

def query_gemini_with_key(prompt: str, api_key: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2
        }
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            return text
    except Exception as e:
        print(f"Gemini API request failed for key ending in {api_key[-6:] if api_key else ''}: {e}")
        if hasattr(e, 'read'):
            try:
                print("Error response body:", e.read().decode('utf-8'))
            except Exception as read_err:
                print("Failed to read error response body:", read_err)
        return None

def query_gemini(prompt: str) -> str:
    user_key = os.getenv("GEMINI_API_KEY")
    if user_key:
        res = query_gemini_with_key(prompt, user_key)
        if res:
            return res
    return None


def get_vitals_summary(vitals, disease_type):
    """
    Generate a friendly human-readable summary of the vitals context.
    """
    if not vitals:
        return "No diagnostic vitals context loaded. Please perform a risk scan first so I can assist you better."
    
    parts = []
    dtype_str = str(disease_type).upper() if disease_type else "HEALTH RECORD"
    
    if 'glucose' in vitals:
        parts.append(f"Glucose: {vitals['glucose']} mg/dL")
    if 'avgGlucoseLevel' in vitals:
        parts.append(f"Avg Glucose: {vitals['avgGlucoseLevel']} mg/dL")
    if 'bloodPressure' in vitals:
        parts.append(f"Blood Pressure: {vitals['bloodPressure']} mmHg")
    if 'restingBP' in vitals:
        parts.append(f"Resting BP: {vitals['restingBP']} mmHg")
    if 'bmi' in vitals:
        parts.append(f"BMI: {vitals['bmi']}")
    if 'cholesterol' in vitals:
        parts.append(f"Cholesterol: {vitals['cholesterol']} mg/dL")
    if 'heartRate' in vitals:
        parts.append(f"Heart Rate: {vitals['heartRate']} bpm")
    if 'tsh' in vitals:
        parts.append(f"TSH: {vitals['tsh']} uIU/mL")
    if 't3' in vitals:
        parts.append(f"T3: {vitals['t3']} pg/mL")
    if 't4' in vitals:
        parts.append(f"T4: {vitals['t4']} ng/dL")
    if 'haemoglobin' in vitals:
        parts.append(f"Hemoglobin: {vitals['haemoglobin']} g/dL")
    if 'rbcCount' in vitals:
        parts.append(f"RBC Count: {vitals['rbcCount']} M/uL")
    if 'serumCreatinine' in vitals:
        parts.append(f"Creatinine: {vitals['serumCreatinine']} mg/dL")
    if 'bloodUrea' in vitals:
        parts.append(f"Urea: {vitals['bloodUrea']} mg/dL")
    if 'totalBilirubin' in vitals:
        parts.append(f"Bilirubin: {vitals['totalBilirubin']} mg/dL")
    if 'oxygenSaturation' in vitals:
        parts.append(f"SpO2: {vitals['oxygenSaturation']}%")
        
    return f"Active Context ({dtype_str}): " + ", ".join(parts)

def respond_to_query(message, vitals, disease_type):
    """
    Main entry point for generating conversational response.
    """
    msg = message.lower().strip()
    
    # Identify which vitals might be concerning based on standard ranges
    concerns = []
    
    glucose = vitals.get('glucose') or vitals.get('avgGlucoseLevel')
    if glucose and float(glucose) >= 126.0:
        concerns.append(("Elevated Glucose", f"{glucose} mg/dL (Diabetes/Glycemic Risk)"))
    elif glucose and float(glucose) >= 100.0:
        concerns.append(("Borderline Glucose", f"{glucose} mg/dL (Prediabetes Risk)"))
        
    bp = vitals.get('bloodPressure') or vitals.get('restingBP')
    if bp and float(bp) >= 140.0:
        concerns.append(("Elevated Blood Pressure", f"{bp} mmHg (Hypertension Risk)"))
    elif bp and float(bp) >= 120.0:
        concerns.append(("Prehypertension BP", f"{bp} mmHg (Mild Cardiovascular Strain)"))
        
    chol = vitals.get('cholesterol')
    if chol and float(chol) >= 240.0:
        concerns.append(("High Cholesterol", f"{chol} mg/dL (Cardiovascular Risk)"))
    elif chol and float(chol) >= 200.0:
        concerns.append(("Borderline Cholesterol", f"{chol} mg/dL (Moderate Plaque Risk)"))
        
    tsh = vitals.get('tsh')
    if tsh and float(tsh) > 4.5:
        concerns.append(("Elevated TSH", f"{tsh} uIU/mL (Hypothyroidism Indicator)"))
    elif tsh and float(tsh) < 0.4:
        concerns.append(("Suppressed TSH", f"{tsh} uIU/mL (Hypercontent/Hyperthyroidism Indicator)"))
        
    creat = vitals.get('serumCreatinine')
    if creat and float(creat) > 1.2:
        concerns.append(("Elevated Serum Creatinine", f"{creat} mg/dL (Renal Processing Strain)"))
        
    bili = vitals.get('totalBilirubin')
    if bili and float(bili) > 1.2:
        concerns.append(("Elevated Bilirubin", f"{bili} mg/dL (Hepatic Stress Indicator)"))
        
    hb = vitals.get('haemoglobin')
    if hb and float(hb) < 12.0:
        concerns.append(("Low Hemoglobin", f"{hb} g/dL (Clinical Anemia Risk)"))
        
    spo2 = vitals.get('oxygenSaturation')
    if spo2 and float(spo2) < 95.0:
        concerns.append(("Low Oxygen Saturation", f"{spo2}% (Pulmonary Processing Strain)"))

    # Try calling the real LLM first
    vitals_context = get_vitals_summary(vitals, disease_type)
    system_prompt = (
        "You are the 'MediPredict Advisor', a professional clinical virtual assistant. "
        "Your goal is to explain the patient's health parameters, suggest lifestyle/dietary changes, "
        "and suggest specific questions they should ask their doctor. "
        "Here is the patient's current vitals context:\n"
        f"{vitals_context}\n\n"
        "Guidelines:\n"
        "1. Focus on the patient's vitals context. Provide clear, medical explanations.\n"
        "2. Suggest healthy diets (e.g. low-carb for high glucose, low-sodium for high BP) and active exercises.\n"
        "3. List 2-3 questions they should ask their doctor.\n"
        "4. Format your output in clean Markdown with headings (use ### for subheadings), bold text, and bullet points.\n"
        "5. Keep the tone professional, clinical, reassuring, and accessible.\n"
        "6. Do not make up facts; if a metric is not present, guide them generally.\n"
        "7. Answer the user's specific query directly within this context.\n\n"
        f"User Query: {message}\n"
        "Advisor Response:"
    )
    gemini_reply = query_gemini(system_prompt)
    if gemini_reply:
        return gemini_reply
    
    # Identify which vitals might be concerning based on standard ranges
    concerns = []
    
    glucose = vitals.get('glucose') or vitals.get('avgGlucoseLevel')
    if glucose and float(glucose) >= 126.0:
        concerns.append(("Elevated Glucose", f"{glucose} mg/dL (Diabetes/Glycemic Risk)"))
    elif glucose and float(glucose) >= 100.0:
        concerns.append(("Borderline Glucose", f"{glucose} mg/dL (Prediabetes Risk)"))
        
    bp = vitals.get('bloodPressure') or vitals.get('restingBP')
    if bp and float(bp) >= 140.0:
        concerns.append(("Elevated Blood Pressure", f"{bp} mmHg (Hypertension Risk)"))
    elif bp and float(bp) >= 120.0:
        concerns.append(("Prehypertension BP", f"{bp} mmHg (Mild Cardiovascular Strain)"))
        
    chol = vitals.get('cholesterol')
    if chol and float(chol) >= 240.0:
        concerns.append(("High Cholesterol", f"{chol} mg/dL (Cardiovascular Risk)"))
    elif chol and float(chol) >= 200.0:
        concerns.append(("Borderline Cholesterol", f"{chol} mg/dL (Moderate Plaque Risk)"))
        
    tsh = vitals.get('tsh')
    if tsh and float(tsh) > 4.5:
        concerns.append(("Elevated TSH", f"{tsh} uIU/mL (Hypothyroidism Indicator)"))
    elif tsh and float(tsh) < 0.4:
        concerns.append(("Suppressed TSH", f"{tsh} uIU/mL (Hypercontent/Hyperthyroidism Indicator)"))
        
    creat = vitals.get('serumCreatinine')
    if creat and float(creat) > 1.2:
        concerns.append(("Elevated Serum Creatinine", f"{creat} mg/dL (Renal Processing Strain)"))
        
    bili = vitals.get('totalBilirubin')
    if bili and float(bili) > 1.2:
        concerns.append(("Elevated Bilirubin", f"{bili} mg/dL (Hepatic Stress Indicator)"))
        
    hb = vitals.get('haemoglobin')
    if hb and float(hb) < 12.0:
        concerns.append(("Low Hemoglobin", f"{hb} g/dL (Clinical Anemia Risk)"))
        
    spo2 = vitals.get('oxygenSaturation')
    if spo2 and float(spo2) < 95.0:
        concerns.append(("Low Oxygen Saturation", f"{spo2}% (Pulmonary Processing Strain)"))

    # Response Routing logic
    # Wellness checks
    if any(q in msg for q in ["how are you", "how r you", "how r u", "how do you do", "how is it going", "how's it going"]):
        return "### MediPredict AI Advisor 🤖\n\nI am doing well, thank you! I'm here and ready to help you analyze your medical results, suggest heart/liver/diabetes dietary options, or clarify what questions to ask your physician. How can I help you today?"

    # Identity checks
    if any(q in msg for q in ["who are you", "what is your name", "your name", "what are you"]):
        return "### MediPredict AI Advisor 🤖\n\nI am the **MediPredict Advisor**, your personal virtual medical assistant. I analyze your diagnostic vitals context to explain test results, recommend lifestyle adjustments, and formulate questions for your next doctor's appointment."

    # Gratitude checks
    if any(q in msg for q in ["thank you", "thanks", "thank u", "awesome", "perfect", "great", "okay", "ok"]):
        return "### MediPredict AI Advisor 🤖\n\nYou're very welcome! If you have any other questions about blood pressure, glucose, thyroid levels, or general diet recommendations, feel free to ask. Stay healthy! 🍏"

    # Greeting / General Help
    if any(greet in msg for greet in ["hello", "hi", "hey", "greetings", "introduce"]):
        welcome = "### Welcome to MediPredict Advisor! 👋\n\nI am your virtual clinical guide. I analyze your test results to offer dietary advice, clarify what your metrics mean, and help prepare questions for your physician.\n\n"
        if concerns:
            welcome += "**Key areas I noticed in your latest test:**\n"
            for label, val in concerns:
                welcome += f"- **{label}**: {val}\n"
            welcome += "\nHow can I help you explain these results further? You can ask about dietary options, exercise guidelines, or specific questions to take to your doctor."
        else:
            welcome += "I have loaded your health record. There are no major critical flags in your current vitals context. How can I assist you today?"
        return welcome
        
    # Thyroid queries
    if "tsh" in msg or "thyroid" in msg or "hypothyroid" in msg or "hyperthyroid" in msg:
        tsh_val = vitals.get('tsh')
        response = "### Thyroid Function & TSH Explanation 🦋\n\n"
        response += "Thyroid-Stimulating Hormone (TSH) is produced by your pituitary gland to regulate your metabolism. Standard levels typically range from **0.4 to 4.5 uIU/mL**.\n\n"
        
        if tsh_val:
            t_val = float(tsh_val)
            response += f"Your current loaded TSH level is **{t_val} uIU/mL**.\n\n"
            if t_val > 4.5:
                response += "💡 **Hypothyroidism Indicator (Underactive Thyroid):**\n"
                response += "Because your TSH is high, it suggests your thyroid gland is underproducing thyroid hormones (T3/T4), and your pituitary gland is overcompensating. This can cause tiredness, weight gain, feeling cold, and dry skin.\n\n"
                response += "**🍏 Lifestyle & Dietary Suggestions:**\n"
                response += "- Ensure adequate (but not excessive) dietary iodine (seafood, iodized salt).\n"
                response += "- Incorporate selenium and zinc-rich foods (brazil nuts, eggs, lean meats).\n"
                response += "- Avoid eating raw cruciferous vegetables (broccoli, cabbage) in massive quantities, as they contain goitrogens that can suppress thyroid activity.\n\n"
                response += "**🩺 Questions for your Physician:**\n"
                response += "1. Should we test my Free T4 and Free T3 levels to confirm thyroid status?\n"
                response += "2. Would thyroid hormone replacement therapy (e.g., Levothyroxine) be appropriate for me?\n"
                response += "3. How long should we wait before checking my thyroid panel again?"
            elif t_val < 0.4:
                response += "💡 **Hyperthyroidism Indicator (Overactive Thyroid):**\n"
                response += "Your TSH is low, which indicates your thyroid is overproducing hormones, causing the pituitary to shut down TSH production. Common symptoms include rapid heart rate, weight loss, and anxiety.\n\n"
                response += "**🍏 Lifestyle & Dietary Suggestions:**\n"
                response += "- Focus on calcium and vitamin D foods (dairy, fortified milks) to protect bone health.\n"
                response += "- Limit iodine-heavy foods like seaweed, kelp, or iodized salt.\n"
                response += "- Keep caffeine intake minimal to avoid exacerbating heart palpitations.\n\n"
                response += "**🩺 Questions for your Physician:**\n"
                response += "1. Do I need an ultrasound or thyroid scan to assess for nodules?\n"
                response += "2. Are beta-blockers recommended to help manage palpitations or tremors?\n"
                response += "3. What are my options regarding antithyroid medications?"
            else:
                response += "✅ Your thyroid markers are in the **Normal Range**. Keep doing regular screenings once a year and focus on balanced nutrition."
        else:
            response += "⚠️ *Note: I do not see a thyroid test in your current context. However, here is what high/low levels generally indicate:*\n"
            response += "- **High TSH (> 4.5):** Suggests hypothyroidism (sluggish metabolism, fatigue).\n"
            response += "- **Low TSH (< 0.4):** Suggests hyperthyroidism (anxiety, weight loss).\n\n"
            response += "If you plan to visit a doctor, ask: *'Would a thyroid panel (TSH, Free T3, Free T4) be useful based on my overall health history?'*"
            
        return response

    # Glucose / Diabetes queries
    if "glucose" in msg or "sugar" in msg or "diabetes" in msg or "glycemic" in msg:
        g_val = vitals.get('glucose') or vitals.get('avgGlucoseLevel')
        response = "### Glucose and Diabetes Risk Analysis 🩺\n\n"
        response += "Fasting blood glucose standard categories:\n"
        response += "- **Normal:** < 100 mg/dL\n"
        response += "- **Prediabetes:** 100 - 125 mg/dL\n"
        response += "- **Diabetes:** >= 126 mg/dL\n\n"
        
        if g_val:
            val = float(g_val)
            response += f"Your current loaded Glucose value is **{val} mg/dL**.\n\n"
            if val >= 126.0:
                response += "⚠️ **Highly Elevated Glucose:**\n"
                response += "This level indicates high glycemic risk or diabetes. Consistently high glucose damages blood vessels and nerves, leading to cardiovascular, renal, and vision complications.\n\n"
                response += "**🍏 Dietary & Lifestyle Interventions:**\n"
                response += "- **Strict Carbohydrate Monitoring:** Focus on complex carbs with low glycemic index (quinoa, oats, legumes) and strictly avoid juices, sodas, and white sugar.\n"
                response += "- **Increase Soluble Fiber:** Fibrous vegetables (broccoli, spinach) slow glucose absorption, preventing insulin spikes.\n"
                response += "- **Regular Activity:** A 15-minute walk post-meals works wonders to pull glucose directly into muscle cells.\n\n"
                response += "**🩺 Questions for your Physician:**\n"
                response += "1. Should we run an HbA1c test to get my 3-month average sugar levels?\n"
                response += "2. Do I need to start taking oral hypoglycemic medications (like Metformin)?\n"
                response += "3. What target range should I aim for when monitoring at home?"
            elif val >= 100.0:
                response += "⚠️ **Prediabetes Range:**\n"
                response += "Your blood sugar is elevated but hasn't reached clinical diabetes levels. This is the optimal window to reverse glycemic stress through lifestyle adjustments.\n\n"
                response += "**🍏 Dietary & Lifestyle Interventions:**\n"
                response += "- Limit refined carbohydrates (white bread, white rice) and practice portion control.\n"
                response += "- Walk or perform light exercise for 30 minutes, 5 times a week.\n"
                response += "- Stay well hydrated with plain water or herbal teas.\n\n"
                response += "**🩺 Questions for your Physician:**\n"
                response += "1. Are lifestyle modifications alone enough to bring my glucose down?\n"
                response += "2. How frequently should we recheck my fasting glucose?"
            else:
                response += "✅ Your glucose profile is **Stable**. Maintain a balanced high-fiber diet to sustain healthy insulin sensitivity."
        else:
            response += "⚠️ *I do not see glucose levels in your current context. General tips for blood sugar management:*\n"
            response += "- Prioritize low-carb, high-fiber dietary items.\n"
            response += "- Stay physically active post-meals.\n"
            response += "Ask your physician: *'Should we check my fasting glucose or HbA1c at my next physical check?'*"
            
        return response

    # Blood Pressure / Cardiovascular queries
    if "pressure" in msg or "bp" in msg or "hypertension" in msg or "cardiovascular" in msg or "heart" in msg or "cholesterol" in msg:
        bp_val = vitals.get('bloodPressure') or vitals.get('restingBP')
        chol_val = vitals.get('cholesterol')
        response = "### Cardiovascular & Blood Pressure Support ❤️\n\n"
        
        has_vitals = False
        if bp_val:
            has_vitals = True
            b_val = float(bp_val)
            response += f"- Loaded Blood Pressure: **{b_val} mmHg** "
            if b_val >= 140.0:
                response += "(Elevated / Stage 2 Hypertension Risk) ⚠️\n"
            elif b_val >= 120.0:
                response += "(Prehypertension / Borderline) ⚠️\n"
            else:
                response += "(Healthy / Normal) ✅\n"
                
        if chol_val:
            has_vitals = True
            c_val = float(chol_val)
            response += f"- Loaded Total Cholesterol: **{c_val} mg/dL** "
            if c_val >= 240.0:
                response += "(High Risk) ⚠️\n"
            elif c_val >= 200.0:
                response += "(Borderline) ⚠️\n"
            else:
                response += "(Healthy / Optimal) ✅\n"
                
        response += "\n"
        
        # Determine advice based on values
        is_elevated = (bp_val and float(bp_val) >= 120.0) or (chol_val and float(chol_val) >= 200.0)
        
        if is_elevated:
            response += "⚠️ **High Cardiovascular Risk Factors Detected:**\n"
            response += "Elevated blood pressure forces your heart to work harder, thickening cardiac muscles. Combined with high cholesterol, this accelerates lipid deposition (plaque) in arterial walls.\n\n"
            response += "**🍏 Dietary & Lifestyle Interventions:**\n"
            response += "- **DASH Diet Protocol:** Significantly reduce sodium (limit to < 1,500 - 2,000 mg daily). Avoid processed deli meats, canned soups, and salty snacks.\n"
            response += "- **Heart-Healthy Fats:** Replace saturated fats (butter, fatty red meats) with polyunsaturated and monounsaturated oils (olive oil, avocados, fish oil).\n"
            response += "- **Aerobic Conditioning:** Engaging in brisk walking, swimming, or cycling for 30 minutes daily increases arterial flexibility.\n\n"
            response += "**🩺 Questions for your Physician:**\n"
            response += "1. Should we run a full lipid panel (LDL, HDL, Triglycerides)?\n"
            response += "2. What is my specific cardiovascular risk score, and do I require BP medication?\n"
            response += "3. Is it safe for me to start a moderate-intensity exercise routine?"
        else:
            if has_vitals:
                response += "✅ Your cardiovascular and blood pressure parameters look **Optimal**. Continue a low-sodium, high-antioxidant diet to protect vascular elasticities.\n\n"
            else:
                response += "⚠️ *No blood pressure or cholesterol data loaded. General recommendations:*\n"
                response += "- Keep sodium under 2,000 mg/day.\n"
                response += "- Perform regular aerobic exercises.\n"
                response += "Ask your doctor: *'What are my blood pressure and cholesterol goals based on my age?'*"
                
        return response

    # Kidney / Renal queries
    if "kidney" in msg or "renal" in msg or "creatinine" in msg or "urea" in msg:
        creat_val = vitals.get('serumCreatinine')
        urea_val = vitals.get('bloodUrea')
        response = "### Renal Function & Kidney Health 🧪\n\n"
        
        has_vitals = False
        if creat_val:
            has_vitals = True
            c_val = float(creat_val)
            response += f"- Serum Creatinine: **{c_val} mg/dL** (Normal is 0.6 - 1.2 mg/dL)\n"
        if urea_val:
            has_vitals = True
            u_val = float(urea_val)
            response += f"- Blood Urea: **{u_val} mg/dL** (Normal is 7 - 20 mg/dL)\n"
            
        response += "\n"
        
        is_elevated = (creat_val and float(creat_val) > 1.2) or (urea_val and float(urea_val) > 20.0)
        
        if is_elevated:
            response += "⚠️ **Elevated Renal Processing Markers:**\n"
            response += "When creatinine or urea accumulates, it means the kidneys are filtering waste less efficiently. This can be caused by dehydration, high blood pressure, diabetes, or medication usage.\n\n"
            response += "**🍏 Dietary & Lifestyle Interventions:**\n"
            response += "- **Hydration Balance:** Stay well hydrated (approx 2-3 liters/day) to support renal blood flow, but avoid sudden hyperhydration.\n"
            response += "- **Protein Regulation:** Limit massive protein intakes, as breakdown products place extra filtration stress on glomeruli.\n"
            response += "- **Limit NSAIDs:** Avoid over-the-counter painkillers like Ibuprofen/Naproxen which reduce blood flow to the kidneys.\n\n"
            response += "**🩺 Questions for your Physician:**\n"
            response += "1. What is my estimated Glomerular Filtration Rate (eGFR)?\n"
            response += "2. Are any of my regular medications or supplements stressing my kidneys?\n"
            response += "3. Should we run a urinalysis to check for protein leakage?"
        else:
            if has_vitals:
                response += "✅ Your renal parameters look **Healthy**. Ensure regular water intake and monitor blood pressure to prevent long-term kidney stress."
            else:
                response += "⚠️ *No kidney markers loaded. General guidance:*\n"
                response += "- Avoid chronic use of NSAID painkillers.\n"
                response += "- Stay adequately hydrated.\n"
                response += "Ask your doctor: *'Are my urea and creatinine levels showing optimal filtration?'*"
                
        return response

    # Liver / Hepatic queries
    if "liver" in msg or "hepatic" in msg or "bilirubin" in msg or "alt" in msg or "ast" in msg:
        bili_val = vitals.get('totalBilirubin')
        alt_val = vitals.get('altaminoTransferase')
        ast_val = vitals.get('aspartateAminoTransferase')
        
        response = "### Liver Health & Hepatobiliary Analysis 🧪\n\n"
        has_vitals = False
        
        if bili_val:
            has_vitals = True
            response += f"- Total Bilirubin: **{bili_val} mg/dL** (Normal is 0.1 - 1.2 mg/dL)\n"
        if alt_val:
            has_vitals = True
            response += f"- ALT: **{alt_val} U/L** (Normal is 7 - 56 U/L)\n"
        if ast_val:
            has_vitals = True
            response += f"- AST: **{ast_val} U/L** (Normal is 10 - 40 U/L)\n"
            
        response += "\n"
        
        is_elevated = (bili_val and float(bili_val) > 1.2) or (alt_val and float(alt_val) > 56.0) or (ast_val and float(ast_val) > 40.0)
        
        if is_elevated:
            response += "⚠️ **Elevated Liver Enzymes / Hepatic Stress:**\n"
            response += "High ALT/AST indicates hepatocyte leakage (cells are releasing enzymes into blood due to irritation or fatty changes). High bilirubin might indicate slow bile flow or processing issues.\n\n"
            response += "**🍏 Dietary & Lifestyle Interventions:**\n"
            response += "- **Eliminate Hepatotoxins:** Strictly avoid alcohol, fatty deep-fried items, and unprescribed herbal supplements.\n"
            response += "- **Antioxidant Foods:** Consume cruciferous greens, citrus fruits, and green tea to support liver detoxification pathways.\n"
            response += "- **Sugar Control:** Reduce fructose and refined sugars, which are major contributors to non-alcoholic fatty liver disease (NAFLD).\n\n"
            response += "**🩺 Questions for your Physician:**\n"
            response += "1. Should we test for viral hepatitis panels or run a abdominal ultrasound?\n"
            response += "2. Could any medication I am taking be causing my liver enzymes to rise?\n"
            response += "3. When should we re-evaluate my liver panel?"
        else:
            if has_vitals:
                response += "✅ Your liver profiles are **Optimal**. Continue maintaining a balanced low-sugar diet and moderate lifestyle."
            else:
                response += "⚠️ *No liver enzymes loaded. General liver tips:*\n"
                response += "- Avoid heavy alcohol and high fructose corn syrup.\n"
                response += "Ask your doctor: *'Are my liver function test results normal?'*"
                
        return response

    # Anemia / Hemoglobin / RBC
    if "anemia" in msg or "hemoglobin" in msg or "rbc" in msg or "iron" in msg or "blood count" in msg:
        hb_val = vitals.get('haemoglobin')
        rbc_val = vitals.get('rbcCount')
        
        response = "### Hematology & Iron Status Analysis 🩸\n\n"
        has_vitals = False
        
        if hb_val:
            has_vitals = True
            response += f"- Hemoglobin: **{hb_val} g/dL** (Normal is 12 - 17.5 g/dL)\n"
        if rbc_val:
            has_vitals = True
            response += f"- RBC Count: **{rbc_val} M/uL** (Normal is 4.0 - 5.9 M/uL)\n"
            
        response += "\n"
        
        is_low = (hb_val and float(hb_val) < 12.0) or (rbc_val and float(rbc_val) < 4.0)
        
        if is_low:
            response += "⚠️ **Low Hemoglobin / RBC (Anemic Potential):**\n"
            response += "Your oxygen-carrying capacity is reduced, which explains why you might feel fatigued, weak, or dizzy. This is usually due to iron, Vitamin B12, or folate deficiency.\n\n"
            response += "**🍏 Dietary & Lifestyle Interventions:**\n"
            response += "- **Iron-Rich Foods:** Increase consumption of lean red meats, poultry, spinach, lentils, and fortified grains.\n"
            response += "- **Vitamin C Synergy:** Pair iron-rich meals with vitamin C (citrus, tomatoes) to enhance iron absorption. Avoid drinking coffee or tea with meals, as tannins block iron absorption.\n"
            response += "- **B-Vitamins:** Eat eggs, dairy, and leafy greens to support healthy red blood cell production.\n\n"
            response += "**🩺 Questions for your Physician:**\n"
            response += "1. Should we test my iron, ferritin, B12, and folate levels?\n"
            response += "2. Do I need an oral iron supplement, and what dosage is safest for me?\n"
            response += "3. How long until we see improvements in my complete blood count?"
        else:
            if has_vitals:
                response += "✅ Your blood indices are **Optimal**. Continue a nutrient-dense diet to support healthy red cell turnover."
            else:
                response += "⚠️ *No blood counts loaded. General tips:*\n"
                response += "- Ensure iron and vitamin C synergy in your nutrition.\n"
                response += "Ask your doctor: *'Are my hemoglobin and iron reserves optimal?'*"
                
        return response

    # Diet / Lifestyle queries
    if any(k in msg for k in ["diet", "food", "lifestyle", "nutrition", "exercise", "activity", "fit"]):
        response = "### Dietary & Lifestyle Optimization Suggestions 🍏\n\n"
        if concerns:
            response += "Based on your active vitals flags, here is a targeted lifestyle protocol:\n\n"
            for label, val in concerns:
                if "Glucose" in label:
                    response += "- **For Glycemic Strain:** Focus on high-fiber, low-carb plates (50% greens, 25% lean protein, 25% complex carbs). Exercise for 15 minutes after main meals.\n"
                elif "Blood Pressure" in label or "BP" in label:
                    response += "- **For Hypertension Strain:** Reduce daily sodium to under 2,000 mg. Eat potassium-rich foods (avocados, leafy greens) and engage in cardiovascular aerobic exercise.\n"
                elif "Cholesterol" in label:
                    response += "- **For Cholesterol Strain:** Limit butter, fried foods, and trans-fats. Load up on soluble fiber (oats, beans) and omega-3 oils.\n"
                elif "TSH" in label:
                    response += "- **For Thyroid Strain:** Avoid crash dieting. Take zinc and selenium-rich seeds, and cook cruciferous greens.\n"
                elif "Creatinine" in label:
                    response += "- **For Renal Strain:** Stay hydrated with water (not sugary drinks) and moderate protein portions.\n"
            response += "\n**🩺 Ask your Physician:**\n*'Can you connect me with a clinical dietitian to formulate a customized medical nutrition therapy plan?'*"
        else:
            response += "No high-risk flags loaded! For overall health maintenance:\n"
            response += "- **Hydration:** Consume 8-10 glasses of water daily.\n"
            response += "- **Exercise:** Aim for 150 minutes of moderate cardiovascular workout weekly.\n"
            response += "- **Nutrition:** Adopt a balanced Mediterranean-style eating pattern (whole foods, healthy fats, lean protein)."
        return response

    # Questions queries
    if any(k in msg for k in ["question", "physician", "doctor", "ask", "visit"]):
        response = "### Questions to Ask Your Doctor at Your Next Visit 🩺\n\n"
        if concerns:
            response += "I recommend writing down these specific questions to get the most clarity from your physician:\n\n"
            for label, val in concerns:
                response += f"📋 **Regarding your {label} ({val}):**\n"
                if "Glucose" in label:
                    response += "1. Should we test my HbA1c to verify long-term sugar trends?\n2. Are lifestyle adjustments sufficient, or should we discuss glucose medications?\n"
                elif "Blood Pressure" in label or "BP" in label:
                    response += "1. Should I monitor my blood pressure at home, and what limits are concerning?\n2. Is my blood pressure contributing to organ stress?\n"
                elif "Cholesterol" in label:
                    response += "1. Do I need a full fasting lipid panel?\n2. Do you recommend cholesterol medication (like statins)?\n"
                elif "TSH" in label:
                    response += "1. Do we need to measure Free T3/T4 to evaluate my thyroid output?\n2. Do my symptoms match subclinical hypothyroidism/hyperthyroidism?\n"
                elif "Creatinine" in label:
                    response += "1. What is my eGFR score, and are my kidneys filtering optimally?\n2. Are my current medications kidney-safe?\n"
                response += "\n"
        else:
            response += "Since your loaded vitals are stable, here are general preventive questions:\n"
            response += "1. Based on my age and family history, are there additional screenings I should undergo?\n"
            response += "2. Is my current body weight and BMI in a healthy range for me?\n"
            response += "3. When do you recommend we do our next blood checkup?"
        return response

    # Default / fallback response if no keywords matched
    response = "### MediPredict AI Advisor 🤖\n\n"
    if concerns:
        response += "I loaded your health parameters and noticed: " + ", ".join([f"**{l}** ({v})" for l, v in concerns]) + ".\n\n"
    else:
        response += "I have successfully loaded your health record, which appears stable.\n\n"
        
    response += "I can help clarify details about your health metrics. Try asking me one of the following:\n"
    response += "- *'Explain what my TSH levels mean for my thyroid'* 🦋\n"
    response += "- *'How does my glucose affect my diabetes risk?'* 🩸\n"
    response += "- *'Give me dietary options to manage high blood pressure'* 🍏\n"
    response += "- *'What questions should I ask my physician about these results?'* 🩺\n\n"
    response += "Please feel free to type your question directly!"
    return response
