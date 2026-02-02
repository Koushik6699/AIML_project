import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

from ai_service import chat_with_ai
from ml_service import predict_career


# ===================== APP SETUP =====================

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "online",
        "message": "PathFinder AI Backend is running"
    }), 200

# ===================== AI ROUTE =====================

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(force=True)
        user_prompt = data.get("prompt") or data.get("message")

        result = chat_with_ai(user_prompt)

        if "error" in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===================== ML ROUTE =====================

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        result = predict_career(data)

        if isinstance(result, dict) and "error" in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===================== RUN =====================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
