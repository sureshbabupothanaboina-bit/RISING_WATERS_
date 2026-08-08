import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify, Response

app = Flask(__name__)

MODELS_DIR = 'models'
models = {}
scaler = None
feature_cols = []
metrics_data = {}

def load_ml_assets():
    global models, scaler, feature_cols, metrics_data
    if os.path.exists(os.path.join(MODELS_DIR, 'scaler.joblib')):
        scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.joblib'))
    if os.path.exists(os.path.join(MODELS_DIR, 'feature_cols.joblib')):
        feature_cols = joblib.load(os.path.join(MODELS_DIR, 'feature_cols.joblib'))
    if os.path.exists(os.path.join(MODELS_DIR, 'metrics.json')):
        with open(os.path.join(MODELS_DIR, 'metrics.json')) as f:
            metrics_data = json.load(f)
            
    model_files = {
        "XGBoost": "xgboost.joblib",
        "Random Forest": "random_forest.joblib",
        "Decision Tree": "decision_tree.joblib",
        "K-Nearest Neighbours (KNN)": "k-nearest_neighbours_knn.joblib"
    }
    
    for name, fname in model_files.items():
        path = os.path.join(MODELS_DIR, fname)
        if os.path.exists(path):
            models[name] = joblib.load(path)
            
load_ml_assets()

def get_evacuation_advisory(risk_score, cloud_vis, jun_sep):
    if risk_score >= 80:
        return {
            "level": "SEVERE / RED ALERT",
            "badge_class": "badge-danger",
            "action": "Immediate Mandatory Evacuation",
            "color": "#ef4444",
            "time_window": "0 - 4 Hours",
            "recommendations": [
                "Issue immediate district-wide siren warning and mobile emergency broadcasts.",
                "Deploy amphibious rescue boats and army disaster response columns.",
                "Open elevated relief centers in non-inundated zones.",
                "Cut power grids in submerged low-lying areas to prevent electrocution."
            ]
        }
    elif risk_score >= 50:
        return {
            "level": "HIGH / ORANGE ALERT",
            "badge_class": "badge-warning",
            "action": "Prepare Preemptive Evacuation",
            "color": "#f97316",
            "time_window": "6 - 12 Hours",
            "recommendations": [
                "Place emergency response teams on high alert at staging points.",
                "Advise vulnerable populations (elderly, low-lying coastal homes) to relocate.",
                "Stock food packets, clean water, and medical kits at community centers.",
                "Monitor river catchment discharge rates continuously."
            ]
        }
    elif risk_score >= 25:
        return {
            "level": "MODERATE / YELLOW ALERT",
            "badge_class": "badge-moderate",
            "action": "Heightened Monitoring",
            "color": "#eab308",
            "time_window": "12 - 24 Hours",
            "recommendations": [
                "Inspect local storm drains and embankment integrity.",
                "Alert local municipal response committees.",
                "Issue advisory for fishermen and riverine communities."
            ]
        }
    else:
        return {
            "level": "LOW / GREEN ALERT",
            "badge_class": "badge-success",
            "action": "Normal Surveillance",
            "color": "#22c55e",
            "time_window": "Routine",
            "recommendations": [
                "No immediate flood threat detected.",
                "Continue standard meteorological monitoring."
            ]
        }

def calculate_resource_needs(risk_score, region_name):
    mult = risk_score / 100.0
    return {
        "region": region_name,
        "risk_score": round(risk_score, 1),
        "priority": "CRITICAL" if risk_score >= 75 else ("HIGH" if risk_score >= 50 else ("MEDIUM" if risk_score >= 25 else "LOW")),
        "rescue_boats": int(np.ceil(15 * mult)),
        "medical_kits": int(np.ceil(250 * mult)),
        "sandbags_units": int(np.ceil(5000 * mult)),
        "relief_personnel": int(np.ceil(80 * mult)),
        "evacuation_buses": int(np.ceil(12 * mult))
    }

# Flask Web Routes
@app.route('/')
def index():
    return render_template('index.html', page="early_warning")

@app.route('/disaster-response')
def disaster_response():
    return render_template('response.html', page="disaster_response")

@app.route('/model-validation')
def model_validation():
    return render_template('validation.html', page="model_validation")

# API Endpoints
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        ann = float(data.get('ANNUAL', 2400))
        jan_feb = float(data.get('Jan_Feb', 25))
        mar_may = float(data.get('Mar_May', 150))
        jun_sep = float(data.get('Jun_Sep', 1600))
        oct_dec = float(data.get('Oct_Dec', 250))
        cloud_vis = float(data.get('Cloud_Visibility_Pct', 35))
        elevation = float(data.get('Elevation_m', 45))
        max_temp = float(data.get('Max_Temp_C', 29.5))
        selected_model = data.get('model', 'XGBoost')
        
        input_dict = {
            'ANNUAL': ann,
            'Jan_Feb': jan_feb,
            'Mar_May': mar_may,
            'Jun_Sep': jun_sep,
            'Oct_Dec': oct_dec,
            'Cloud_Visibility_Pct': cloud_vis,
            'Elevation_m': elevation,
            'Max_Temp_C': max_temp
        }
        
        df_input = pd.DataFrame([input_dict])[feature_cols]
        
        all_predictions = {}
        for name, model_obj in models.items():
            if name == "K-Nearest Neighbours (KNN)" and scaler is not None:
                scaled_input = scaler.transform(df_input)
                prob = float(model_obj.predict_proba(scaled_input)[0][1])
                pred = int(model_obj.predict(scaled_input)[0])
            else:
                prob = float(model_obj.predict_proba(df_input)[0][1])
                pred = int(model_obj.predict(df_input)[0])
            all_predictions[name] = {
                "probability": round(prob * 100, 2),
                "prediction": pred,
                "label": "Flood Likely" if pred == 1 else "No Flood"
            }
            
        primary_prob = all_predictions.get(selected_model, all_predictions.get("XGBoost", list(all_predictions.values())[0]))["probability"]
        primary_pred = all_predictions.get(selected_model, all_predictions.get("XGBoost", list(all_predictions.values())[0]))["prediction"]
        
        advisory = get_evacuation_advisory(primary_prob, cloud_vis, jun_sep)
        
        return jsonify({
            "status": "success",
            "selected_model": selected_model,
            "flood_probability": primary_prob,
            "prediction": primary_pred,
            "prediction_label": "HIGH FLOOD RISK" if primary_pred == 1 else "LOW FLOOD RISK",
            "advisory": advisory,
            "all_model_predictions": all_predictions,
            "features": input_dict
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/batch-predict', methods=['POST'])
def batch_predict():
    try:
        regions_data = request.json.get('regions', [])
        model_name = request.json.get('model', 'XGBoost')
        model_obj = models.get(model_name, models.get('XGBoost'))
        
        results = []
        for reg in regions_data:
            r_name = reg.get('Subdivision', 'District X')
            df_in = pd.DataFrame([{
                'ANNUAL': float(reg.get('ANNUAL', 2000)),
                'Jan_Feb': float(reg.get('Jan_Feb', 20)),
                'Mar_May': float(reg.get('Mar_May', 100)),
                'Jun_Sep': float(reg.get('Jun_Sep', 1400)),
                'Oct_Dec': float(reg.get('Oct_Dec', 200)),
                'Cloud_Visibility_Pct': float(reg.get('Cloud_Visibility_Pct', 40)),
                'Elevation_m': float(reg.get('Elevation_m', 50)),
                'Max_Temp_C': float(reg.get('Max_Temp_C', 30))
            }])[feature_cols]
            
            if model_name == "K-Nearest Neighbours (KNN)" and scaler is not None:
                scaled = scaler.transform(df_in)
                prob = float(model_obj.predict_proba(scaled)[0][1])
            else:
                prob = float(model_obj.predict_proba(df_in)[0][1])
                
            risk_score = round(prob * 100, 1)
            alloc = calculate_resource_needs(risk_score, r_name)
            results.append(alloc)
            
        results.sort(key=lambda x: x['risk_score'], reverse=True)
        return jsonify({"status": "success", "data": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/export-csv', methods=['GET'])
def export_csv():
    # Dynamic CSV exporter for disaster relief planners
    mock_regions = [
        {"Subdivision": "Kerala District 01 (Wayanad Basin)", "ANNUAL": 3100, "Jan_Feb": 15, "Mar_May": 180, "Jun_Sep": 2100, "Oct_Dec": 320, "Cloud_Visibility_Pct": 15, "Elevation_m": 20, "Max_Temp_C": 26.5},
        {"Subdivision": "Assam District 04 (Barpeta)", "ANNUAL": 2800, "Jan_Feb": 30, "Mar_May": 280, "Jun_Sep": 1850, "Oct_Dec": 240, "Cloud_Visibility_Pct": 22, "Elevation_m": 15, "Max_Temp_C": 28.0},
        {"Subdivision": "Konkan District 02 (Ratnagiri)", "ANNUAL": 2450, "Jan_Feb": 20, "Mar_May": 150, "Jun_Sep": 1650, "Oct_Dec": 280, "Cloud_Visibility_Pct": 35, "Elevation_m": 45, "Max_Temp_C": 29.0},
        {"Subdivision": "West Bengal (Malda Lowlands)", "ANNUAL": 2100, "Jan_Feb": 25, "Mar_May": 160, "Jun_Sep": 1420, "Oct_Dec": 220, "Cloud_Visibility_Pct": 40, "Elevation_m": 25, "Max_Temp_C": 30.0},
        {"Subdivision": "Bihar District 03 (Kosi Belt)", "ANNUAL": 1850, "Jan_Feb": 15, "Mar_May": 120, "Jun_Sep": 1280, "Oct_Dec": 190, "Cloud_Visibility_Pct": 52, "Elevation_m": 55, "Max_Temp_C": 32.0},
        {"Subdivision": "Gujarat Coastal Region", "ANNUAL": 1100, "Jan_Feb": 10, "Mar_May": 80, "Jun_Sep": 850, "Oct_Dec": 110, "Cloud_Visibility_Pct": 75, "Elevation_m": 120, "Max_Temp_C": 35.0}
    ]
    
    rows = []
    xgb_model = models.get('XGBoost')
    for reg in mock_regions:
        df_in = pd.DataFrame([reg])[feature_cols]
        prob = float(xgb_model.predict_proba(df_in)[0][1]) * 100.0
        alloc = calculate_resource_needs(prob, reg['Subdivision'])
        rows.append(alloc)
        
    df_out = pd.DataFrame(rows)
    csv_data = df_out.to_csv(index=False)
    
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=disaster_resource_allocation_report.csv"}
    )

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    if not metrics_data and os.path.exists(os.path.join(MODELS_DIR, 'metrics.json')):
        with open(os.path.join(MODELS_DIR, 'metrics.json')) as f:
            return jsonify(json.load(f))
    return jsonify(metrics_data)

@app.route('/api/sample-presets', methods=['GET'])
def get_presets():
    presets = [
        {
            "id": "kerala_severe",
            "name": "Scenario 1: High Monsoon Flood Crisis",
            "description": "Extreme seasonal rainfall (1950mm June-Sept) & dense rain cloud cover (18% visibility)",
            "data": {
                "ANNUAL": 3250.0,
                "Jan_Feb": 15.0,
                "Mar_May": 180.0,
                "Jun_Sep": 2150.0,
                "Oct_Dec": 320.0,
                "Cloud_Visibility_Pct": 18.0,
                "Elevation_m": 25.0,
                "Max_Temp_C": 26.5
            }
        },
        {
            "id": "assam_flash",
            "name": "Scenario 2: Low-Lying Riverine District",
            "description": "Moderate-high monsoon (1550mm) in low elevation river basin (15m elevation)",
            "data": {
                "ANNUAL": 2600.0,
                "Jan_Feb": 30.0,
                "Mar_May": 280.0,
                "Jun_Sep": 1650.0,
                "Oct_Dec": 240.0,
                "Cloud_Visibility_Pct": 32.0,
                "Elevation_m": 15.0,
                "Max_Temp_C": 28.0
            }
        },
        {
            "id": "normal_season",
            "name": "Normal Season / Safe Dry Conditions",
            "description": "Standard rainfall (750mm June-Sept) & high cloud visibility (75%)",
            "data": {
                "ANNUAL": 1150.0,
                "Jan_Feb": 10.0,
                "Mar_May": 60.0,
                "Jun_Sep": 720.0,
                "Oct_Dec": 110.0,
                "Cloud_Visibility_Pct": 78.0,
                "Elevation_m": 350.0,
                "Max_Temp_C": 34.0
            }
        }
    ]
    return jsonify(presets)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
