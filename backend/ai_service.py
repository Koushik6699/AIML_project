import os
import google.generativeai as genai

# ===================== GEMINI SETUP =====================

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing from environment variables")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel("gemini-2.5-flash")

def chat_with_ai(user_prompt: str):
    if not user_prompt:
        return {"error": "No prompt provided."}

    response = model.generate_content(user_prompt)

    return {
        "advice": response.text,
        "reply": response.text
    }
