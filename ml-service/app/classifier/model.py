import os
import joblib
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../models/classifier_pipeline.joblib')

class TransactionClassifier:
    def __init__(self):
        self.pipeline = None
        self.load_or_init()

    def load_or_init(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                print(f"Loaded classifier model from {MODEL_PATH}")
                return
            except Exception as e:
                print(f"Failed to load existing model: {e}")

        # Initialize default pipeline
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=1000, lowercase=True)),
            ('clf', LogisticRegression(C=1.0, max_iter=500, class_weight='balanced'))
        ])

    def train(self, df: pd.DataFrame):
        X = df['description'].astype(str)
        y = df['category'].astype(str)
        self.pipeline.fit(X, y)
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        joblib.dump(self.pipeline, MODEL_PATH)
        print(f"Trained and saved model to {MODEL_PATH}")

    def predict(self, description: str):
        if not self.pipeline:
            self.load_or_init()
        probs = self.pipeline.predict_proba([description])[0]
        classes = self.pipeline.classes_
        max_idx = probs.argmax()
        category = classes[max_idx]
        confidence = float(probs[max_idx])
        return category, confidence

    def predict_batch(self, descriptions: list[str]):
        if not self.pipeline:
            self.load_or_init()
        if not descriptions:
            return []
        probs_all = self.pipeline.predict_proba(descriptions)
        classes = self.pipeline.classes_
        results = []
        for probs in probs_all:
            max_idx = probs.argmax()
            results.append((classes[max_idx], float(probs[max_idx])))
        return results

