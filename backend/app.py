import os
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

# ===================== GEMINI SETUP (UNCHANGED LOGIC) =====================

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

        if not user_prompt or not str(user_prompt).strip():
            return jsonify({"error": "No prompt provided. Please send a 'prompt' key in your JSON body."}), 400

        response = model.generate_content(user_prompt)

        return jsonify({
            "advice": response.text,
            "reply": response.text
        }), 200

    except Exception as e:
        print(f"❌ Gemini Error: {str(e)}")
        return jsonify({"error": "The AI is temporarily unavailable. Please try again later."}), 500

# ===================== ML SETUP (UNCHANGED LOGIC) =====================

# ML Training Data [DSA, ML, DBMS, Python, Stats]
X_train = np.array([
    [95, 40, 90, 80, 40], [40, 95, 50, 85, 95], [75, 50, 70, 65, 45],
    [45, 75, 40, 70, 80], [30, 20, 30, 30, 20], [50, 50, 50, 50, 50],
    [90, 90, 90, 90, 90], [20, 80, 30, 70, 85]
])

y_prob = np.array([92, 94, 65, 68, 10, 45, 98, 85])
y_class = np.array([0, 1, 0, 1, 0, 0, 0, 1])

lr_model = LinearRegression().fit(X_train, y_prob)
knn_model = KNeighborsClassifier(n_neighbors=3).fit(X_train, y_class)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    marks = np.array(data['marks']).reshape(1, -1)
    all_marks = data.get('all_marks', {})

    base_prob = lr_model.predict(marks)[0]

    dev_weight = (all_marks.get('DSA', 0) * 0.5 +
                  all_marks.get('DBMS', 0) * 0.3 +
                  all_marks.get('OOP', 0) * 0.2)

    ds_weight = (all_marks.get('ML', 0) * 0.5 +
                 all_marks.get('Stats', 0) * 0.3 +
                 all_marks.get('Python', 0) * 0.2)

    ui_weight = (all_marks.get('HTML', 0) * 0.45 +
                 all_marks.get('CSS', 0) * 0.45 +
                 all_marks.get('OOP', 0) * 0.1)

    fs_weight = (all_marks.get('Node.js', 0) * 0.4 +
                 all_marks.get('HTML', 0) * 0.3 +
                 all_marks.get('CSS', 0) * 0.3)

    results = [
        {
            "role": "Software Developer",
            "prob": round(max(5, min(99, (base_prob * 0.3 + dev_weight * 0.7))), 2),
            "algo": "KNN: Cluster Alpha"
        },
        {
            "role": "Data Scientist",
            "prob": round(max(5, min(99, (base_prob * 0.3 + ds_weight * 0.7))), 2),
            "algo": "KNN: Cluster Beta"
        },
        {
            "role": "UI/UX Designer",
            "prob": round(max(5, min(99, (ui_weight))), 2),
            "algo": "Heuristic: Visual Design Match"
        },
        {
            "role": "Full Stack Developer",
            "prob": round(max(5, min(99, (fs_weight))), 2),
            "algo": "Heuristic: Web Stack Analysis"
        }
    ]

    results = [r for r in results if r['prob'] > 20]
    results.sort(key=lambda x: x['prob'], reverse=True)

    return jsonify(results)

# ===================== RUN SERVER =====================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
