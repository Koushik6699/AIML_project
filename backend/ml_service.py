import os
import json
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsClassifier

# ===================== ML TRAINING =====================

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

def predict_career(data: dict):
    if "marks" not in data or "all_marks" not in data:
        return {"error": "marks or all_marks missing in request"}

    marks = data["marks"]
    all_marks = data["all_marks"]

    if not isinstance(marks, list) or len(marks) != 5:
        return {
            "error": "marks must be exactly 5 values: [DSA, ML, DBMS, Python, Stats]"
        }

    marks = np.array(marks).reshape(1, -1)

    base_ml_prob = float(lr_model.predict(marks)[0])
    knn_res = int(knn_model.predict(marks)[0])
    algo_tag = "KNN: Cluster Alpha" if knn_res == 0 else "KNN: Cluster Beta"

    if not os.path.exists(CAREERS_PATH):
        return {"error": "careers.json not found"}

    with open(CAREERS_PATH, "r", encoding="utf-8") as f:
        careers_data = json.load(f)

    results = []

    for career in careers_data["careers"]:
        weighted_sum = 0
        total_possible_weight = 0

        for sub in career["subject_weights"]:
            user_mark = all_marks.get(sub["name"], 0)
            weighted_sum += user_mark * sub["weight"]
            total_possible_weight += sub["weight"] * 100

        specific_score = (
            (weighted_sum / total_possible_weight) * 100
            if total_possible_weight > 0 else 0
        )

        final_prob = (base_ml_prob * 0.3) + (specific_score * 0.7)

        results.append({
            "role": career["title"],
            "prob": round(max(5, min(99, final_prob)), 2),
            "algo": algo_tag if "Engineer" in career["title"] else "Heuristic Analysis"
        })

    results = [r for r in results if r["prob"] > 15]
    results.sort(key=lambda x: x["prob"], reverse=True)

    return results
