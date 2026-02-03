# PathFinder | AI-Driven Career Mapping & Job Probability

PathFinder is a full-stack web application built to help engineering students analyze **career suitability** and **job placement probability** using **Machine Learning** and **Generative AI**.  
It bridges the gap between academic performance and real-world industry roles by combining data-driven prediction with AI-generated learning roadmaps.

---

## 🚀 Features

- **Job Probability Engine**  
  Uses **Linear Regression** to predict a continuous probability score for job placement.

- **Career Classification**  
  Implements **K-Nearest Neighbors (KNN)** to cluster students into suitable career paths.

- **AI-Generated Career Roadmaps**  
  Integrates **Google Gemini 1.5 Flash** to generate concise, actionable learning roadmaps based on individual subject mastery.

- **Dynamic Scoring UI**  
  Modern, responsive dashboard with interactive subject selection and light/dark mode support.

---

## 🛠️ Tech Stack

### Frontend
- **HTML5 & CSS3** – Custom UI with responsive design
- **JavaScript (ES6+)** – Dynamic UI logic and API communication

### Backend
- **Python (Flask)** – REST API server
- **Scikit-learn** – Linear Regression & KNN models
- **Google Generative AI SDK** – Gemini 1.5 Flash integration
- **Gunicorn** – Production WSGI server

---

## 📂 Project Structure

```text
PathFinder/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── ai_service.py       # Gemini AI logic
│   ├── ml_service.py       # ML models (LR + KNN)
│   ├── careers.json        # Career definitions & weights
│   ├── requirements.txt    # Python dependencies
│   └── .env                # API keys (ignored in git)
│
├── frontend/
│   ├── index.html          # Main UI
│   ├── style.css           # Styling
│   └── script.js           # Frontend logic
│
└── README.md
