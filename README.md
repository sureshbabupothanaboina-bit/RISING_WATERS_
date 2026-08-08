# 🌊 RISING WATERS — Machine Learning Flood Prediction System

An end-to-end Machine Learning-powered Flood Prediction and Early Warning System trained on historical weather data. The platform integrates classification models (**XGBoost, Random Forest, Decision Tree, and K-Nearest Neighbours**) into a modern Flask web application designed for real-time monitoring, resource allocation, and operational decision-making.

---

## 📌 Project Overview & Scenarios

### ⚡ Scenario 1: Early Flood Warning & Evacuation Planning
- Enables meteorologists to input current rainfall, cloud visibility percentage, elevation, and temperature metrics.
- Predicts real-time flood risk probability percentage, danger status alert, and actionable evacuation guidelines.
- Features dynamic multi-model cross-validation output.

### 📑 Scenario 2: Disaster Response & Resource Allocation
- Allows disaster management teams to monitor multiple districts simultaneously during the monsoon season.
- Auto-prioritizes regions by vulnerability and computes required emergency resources:
  - 🚤 Rescue Boats
  - 💊 Medical Kits
  - 🧱 Sandbag Units
  - 👨‍🚒 Emergency Relief Officers
  - 🚌 Evacuation Buses

### 📊 Scenario 3: Model Validation & Performance Assessment
- Evaluates classification algorithms against historical flood event test data.
- **XGBoost Classifier achieves 96.55% accuracy on test data**, confirming high reliability for operational disaster response.
- Includes interactive ROC curves, accuracy & F1-score comparisons, confusion matrices, and feature importance rankings.

---

## 🤖 Machine Learning Model Benchmarks

| Algorithm | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **XGBoost Classifier** | **96.55%** | **94.82%** | **97.24%** | **96.02%** | 🏆 **Top Performer / Deployed** |
| **Random Forest** | 93.97% | 94.49% | 98.30% | 96.36% | Validated |
| **K-Nearest Neighbours (KNN)** | 92.93% | 94.06% | 97.45% | 95.72% | Validated |
| **Decision Tree** | 92.59% | 94.77% | 96.18% | 95.47% | Validated |

---

## 🛠️ Tech Stack & Dependencies

- **Core Logic & ML**: Python 3.11+, Scikit-Learn, XGBoost, Pandas, NumPy, Joblib
- **Web Application Framework**: Flask, Gunicorn
- **Frontend & Visualizations**: HTML5, Vanilla CSS3 (Glassmorphism design system), JavaScript (ES6+), Chart.js
- **Cloud Deployment**: IBM Cloud Foundry (`manifest.yml`, `Procfile`, `runtime.txt`)

---

## 🚀 Quick Start & Local Setup

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/sureshbabupothanaboina-bit/RISING_WATERS_.git
cd RISING_WATERS_
pip install -r requirements.txt
```

### 2. Generate Dataset & Train Models (Optional)
```bash
python generate_dataset.py
python train_models.py
```

### 3. Launch Flask Web Application
```bash
python app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

---

## ☁️ Deployment on IBM Cloud

This application includes native IBM Cloud manifest configurations:
```bash
ibmcloud cf push
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
