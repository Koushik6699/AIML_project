# PathFinder | AI-Driven Career Mapping & Job Probability

PathFinder is a full-stack web application designed to help engineering students predict their job placement probability across various tech roles. By analyzing academic performance through **Machine Learning** and providing personalized growth strategies via **Gemini AI**, PathFinder acts as a bridge between classroom learning and industry readiness.

## 🚀 Features

* **Job Probability Engine**: Uses **Linear Regression** to predict a continuous probability percentage for job placement.
* **Career Classification**: Implements the **K-Nearest Neighbors (KNN)** algorithm to match student profiles into specific career clusters (Software Developer, Data Scientist, UI/UX Designer, etc.).
* **AI-Generated Roadmaps**: Integrates **Google Gemini 1.5 Flash** to provide actionable, short-form roadmaps based on a student's unique subject mastery.
* **Dynamic Scoring UI**: A modern, responsive dashboard supporting both light and dark modes with interactive subject selection chips.

## 🛠️ Tech Stack

### Frontend
* **HTML5 & CSS3**: Custom-built UI using the Inter font family and CSS variables for theming.
* **JavaScript (ES6+)**: Handles dynamic UI transitions and asynchronous API communication with the Python backend.

### Backend
* **Python Flask**: Lightweight web framework managing the API endpoints.
* **Scikit-Learn**: Powering the Linear Regression and KNN models.
* **Google Generative AI SDK**: For connecting to the Gemini 1.5 Pro/Flash models.

## 📂 Project Structure

```text
PathFinder/
├── backend/
│   ├── app.py              # Unified Flask server (ML + AI logic)
│   ├── requirements.txt    # Python dependencies
│   └── .env                # API Keys (Excluded from Git)
├── frontend/
│   ├── index.html          # Main dashboard
│   ├── style.css           # Modern UI styling
│   └── script.js           # Frontend logic & API calls
└── README.md