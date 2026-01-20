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

# ===================== GEMINI SETUP =====================

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
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===================== ML SETUP =====================

X_train = np.array([
    [95, 40, 90, 80, 40],
    [40, 95, 50, 85, 95],
    [75, 50, 70, 65, 45],
    [45, 75, 40, 70, 80],
    [30, 20, 30, 30, 20],
    [50, 50, 50, 50, 50],
    [90, 90, 90, 90, 90],
    [20, 80, 30, 70, 85]
])

y_prob = np.array([92, 94, 65, 68, 10, 45, 98, 85])
y_class = np.array([0, 1, 0, 1, 0, 0, 0, 1])

lr_model = LinearRegression().fit(X_train, y_prob)
knn_model = KNeighborsClassifier(n_neighbors=3).fit(X_train, y_class)

# ===================== LOAD careers.json =====================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAREERS_PATH = os.path.join(BASE_DIR, "careers.json")

# ===================== PREDICT API =====================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        if "marks" not in data or "all_marks" not in data:
            return jsonify({"error": "marks or all_marks missing in request"}), 400

        marks = data["marks"]
        all_marks = data["all_marks"]

        # 🔒 STRICT VALIDATION: model needs exactly 5 features
        if not isinstance(marks, list) or len(marks) != 5:
            return jsonify({
                "error": "marks must be a list of exactly 5 values in order: [DSA, ML, DBMS, Python, Stats]"
            }), 400

        marks = np.array(marks).reshape(1, -1)

        # Base ML prediction
        base_ml_prob = float(lr_model.predict(marks)[0])
        knn_res = int(knn_model.predict(marks)[0])
        algo_tag = "KNN: Cluster Alpha" if knn_res == 0 else "KNN: Cluster Beta"

        # Load careers.json
        if not os.path.exists(CAREERS_PATH):
            return jsonify({"error": "careers.json not found in backend folder"}), 500

        with open(CAREERS_PATH, "r", encoding="utf-8") as f:
            careers_data = json.load(f)

        # 🔒 VALIDATE JSON STRUCTURE
        if "careers" not in careers_data:
            return jsonify({"error": "careers.json missing top-level 'careers' key"}), 500

        results = []

        for career in careers_data["careers"]:
            if "title" not in career or "subject_weights" not in career:
                continue  # skip invalid entries safely

            weighted_sum = 0
            total_possible_weight = 0

            for sub in career["subject_weights"]:
                if "name" not in sub or "weight" not in sub:
                    continue

                sub_name = sub["name"]
                weight = sub["weight"]

                user_mark = all_marks.get(sub_name, 0)

                weighted_sum += (user_mark * weight)
                total_possible_weight += (weight * 100)

            if total_possible_weight > 0:
                specific_score = (weighted_sum / total_possible_weight) * 100
            else:
                specific_score = 0

            final_prob = (base_ml_prob * 0.3) + (specific_score * 0.7)

            results.append({
                "role": career["title"],
                "prob": round(max(5, min(99, final_prob)), 2),
                "algo": algo_tag if "Engineer" in career["title"] else "Heuristic Analysis"
            })

        results = [r for r in results if r["prob"] > 15]
        results.sort(key=lambda x: x["prob"], reverse=True)

        return jsonify(results), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# ===================== RUN =====================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
