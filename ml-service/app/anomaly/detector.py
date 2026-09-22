import numpy as np
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.05, random_state=42)

    def fit_and_score(self, amounts: list[float]):
        if len(amounts) < 5:
            return [0.0] * len(amounts)
        
        X = np.array(amounts).reshape(-1, 1)
        self.model.fit(X)
        scores = self.model.decision_function(X) # lower score = more anomalous
        
        # Normalize into anomaly score 0.0 (normal) to 1.0 (highly anomalous)
        min_s, max_s = scores.min(), scores.max()
        if max_s - min_s == 0:
            return [0.0] * len(amounts)
        
        normalized = 1.0 - (scores - min_s) / (max_s - min_s)
        return [float(round(s, 2)) for s in normalized]
