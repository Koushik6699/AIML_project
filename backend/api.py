import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Enable CORS to allow your frontend (e.g., Live Server on port 5500) to talk to this backend
CORS(app)

# Securely fetch the API key
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from your environment variables.")

# Configure the Gemini API
genai.configure(api_key=API_KEY)
print("✅ Gemini API successfully configured")

# Use gemini-1.5-flash for stable performance. 
# Note: 'gemini-2.5-flash' is not a standard public model version yet.
model = genai.GenerativeModel("gemini-2.5-flash")

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "online", "message": "PathFinder AI Backend is running"}), 200

@app.route("/chat", methods=["POST"])
def chat():
    try:
        # force=True ensures it attempts to parse even if Content-Type header is missing
        data = request.get_json(force=True)
        
        # Consistent key handling: looking for 'prompt' to match your recent frontend updates
        user_prompt = data.get("prompt") or data.get("message")
        
        if not user_prompt or not str(user_prompt).strip():
            return jsonify({"error": "No prompt provided. Please send a 'prompt' key in your JSON body."}), 400

        # Generate content using the Gemini model
        response = model.generate_content(user_prompt)
        
        # The frontend expects 'advice' for roadmaps based on your recent JS code
        return jsonify({
            "advice": response.text,
            "reply": response.text  # Providing 'reply' as a fallback for older versions of your JS
        }), 200

    except Exception as e:
        print(f"❌ Gemini Error: {str(e)}")
        # Returns a professional error message with a 500 status code
        return jsonify({"error": "The AI is temporarily unavailable. Please try again later."}), 500

if __name__ == "__main__":
    # Get port from environment (for deployment) or default to 5000
    port = int(os.environ.get("PORT", 5000))
    # host='0.0.0.0' makes the server accessible on your local network (e.g., 192.168.x.x)
    app.run(host="0.0.0.0", port=port, debug=True)