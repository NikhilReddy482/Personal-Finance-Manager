import os
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
from app.classifier.model import TransactionClassifier

def run_training():
    data_path = os.path.join(os.path.dirname(__file__), '../datasets/synthetic_transactions.json')
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    df = pd.DataFrame(data)
    print(f"Loaded {len(df)} samples across {df['category'].nunique()} categories.")

    clf = TransactionClassifier()
    clf.train(df)

    # Evaluate
    X = df['description']
    y_true = df['category']
    y_pred = [clf.predict(desc)[0] for desc in X]

    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average='weighted')

    print(f"Training Evaluation:")
    print(f"Accuracy: {acc * 100:.2f}%")
    print(f"Weighted F1-Score: {f1:.4f}")

    return acc, f1

if __name__ == '__main__':
    run_training()
