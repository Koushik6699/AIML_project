from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier

app = Flask(__name__)
CORS(app)

# ML Training Data [DSA, ML, DBMS, Python, Stats]
X_train = np.array([
    [95, 40, 90, 80, 40], [40, 95, 50, 85, 95], [75, 50, 70, 65, 45],
    [45, 75, 40, 70, 80], [30, 20, 30, 30, 20], [50, 50, 50, 50, 50],
    [90, 90, 90, 90, 90], [20, 80, 30, 70, 85]
])

y_prob = np.array([92, 94, 65, 68, 10, 45, 98, 85])
y_class = np.array([0, 1, 0, 1, 0, 0, 0, 1])

# Initialize and fit models
lr_model = LinearRegression().fit(X_train, y_prob)
knn_model = KNeighborsClassifier(n_neighbors=3).fit(X_train, y_class)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    marks = np.array(data['marks']).reshape(1, -1)
    all_marks = data.get('all_marks', {}) # Use the full dictionary of marks from JS
    
    # Base probability from the 5 core features
    base_prob = lr_model.predict(marks)[0]
    
    # 1. Software Developer: Focuses on DSA and DBMS
    dev_weight = (all_marks.get('DSA', 0) * 0.5 + all_marks.get('DBMS', 0) * 0.3 + all_marks.get('OOP', 0) * 0.2)
    
    # 2. Data Scientist: Focuses on ML and Stats
    ds_weight = (all_marks.get('ML', 0) * 0.5 + all_marks.get('Stats', 0) * 0.3 + all_marks.get('Python', 0) * 0.2)

    # 3. UI/UX Designer: High priority for HTML/CSS
    ui_weight = (all_marks.get('HTML', 0) * 0.45 + all_marks.get('CSS', 0) * 0.45 + all_marks.get('OOP', 0) * 0.1)

    # 4. Full Stack Developer: Mix of Web and Logic
    fs_weight = (all_marks.get('Node.js', 0) * 0.4 + all_marks.get('HTML', 0) * 0.3 + all_marks.get('CSS', 0) * 0.3)

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
            "prob": round(max(5, min(99, (ui_weight))), 2), # Prioritizing web marks here
            "algo": "Heuristic: Visual Design Match"
        },
        {
            "role": "Full Stack Developer",
            "prob": round(max(5, min(99, (fs_weight))), 2),
            "algo": "Heuristic: Web Stack Analysis"
        }
    ]

    # Filter out low matches and sort by highest
    results = [r for r in results if r['prob'] > 20]
    results.sort(key=lambda x: x['prob'], reverse=True)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)