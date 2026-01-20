import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# ===================== GEMINI SETUP (UNCHANGED) =====================

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from your environment variables.")

genai.configure(api_key=API_KEY)
print("✅ Gemini API successfully configured")

model = genai.GenerativeModel("gemini-2.5-flash")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "online", "message": "PathFinder AI Backend is running"}), 200

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        user_prompt = data.get("prompt") or data.get("message")

        if not user_prompt:
            return jsonify({"error": "No prompt provided."}), 400

        response = model.generate_content(user_prompt)

        return jsonify({
            "advice": response.text,
            "reply": response.text
        }), 200

    except Exception as e:
        print(f"❌ Gemini Error: {str(e)}")
        return jsonify({"error": "AI service unavailable"}), 500

# ===================== ML SETUP (UNCHANGED DATA & MODELS) =====================

X_train = np.array([
    [95, 40, 90, 80, 40], [40, 95, 50, 85, 95], [75, 50, 70, 65, 45],
    [45, 75, 40, 70, 80], [30, 20, 30, 30, 20], [50, 50, 50, 50, 50],
    [90, 90, 90, 90, 90], [20, 80, 30, 70, 85]
])

y_prob = np.array([92, 94, 65, 68, 10, 45, 98, 85])
y_class = np.array([0, 1, 0, 1, 0, 0, 0, 1])

lr_model = LinearRegression().fit(X_train, y_prob)
knn_model = KNeighborsClassifier(n_neighbors=3).fit(X_train, y_class)

# ===================== FIXED CAREERS.JSON LOADING =====================

# Absolute path to careers.json in same folder as this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAREERS_PATH = os.path.join(BASE_DIR, "careers.json")

# ===================== UPDATED PREDICTION LOGIC =====================

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        marks = np.array(data['marks']).reshape(1, -1)
        all_marks = data.get('all_marks', {})

        # 1. Base ML prediction
        base_ml_prob = lr_model.predict(marks)[0]
        knn_res = knn_model.predict(marks)[0]
        algo_tag = "KNN: Cluster Alpha" if knn_res == 0 else "KNN: Cluster Beta"

        # 2. Load careers.json safely
        if not os.path.exists(CAREERS_PATH):
            return jsonify({"error": "careers.json not found on server"}), 500

        with open(CAREERS_PATH, "r") as f:
            careers_data = json.load(f)

        results = []

        # 3. Dynamic scoring (NO SUBJECT REMOVED)
        for careers in careers_data['careers']:
            weighted_sum = 0
            total_possible_weight = 0

            for sub in careers['subject_weights']:
                sub_name = sub['name']
                weight = sub['weight']

                user_mark = all_marks.get(sub_name, 0)

                weighted_sum += (user_mark * weight)
                total_possible_weight += (weight * 100)

            if total_possible_weight > 0:
                specific_score = (weighted_sum / total_possible_weight) * 100
            else:
                specific_score = 0

            final_prob = (base_ml_prob * 0.3) + (specific_score * 0.7)

            results.append({
                "role": careers['title'],
                "prob": round(max(5, min(99, final_prob)), 2),
                "algo": algo_tag if "Engineer" in careers['title'] else "Heuristic Analysis"
            })

        results = [r for r in results if r['prob'] > 15]
        results.sort(key=lambda x: x['prob'], reverse=True)

        return jsonify(results)

    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}")
        return jsonify({"error": "Internal Server Error during prediction"}), 500

# ===================== RUN SERVER =====================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
