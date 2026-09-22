import os
from fastapi import FastAPI
from pydantic import BaseModel
from app.classifier.model import TransactionClassifier
from app.anomaly.detector import AnomalyDetector

app = FastAPI(title="Financial Flow ML Intelligence Service", version="1.0.0")

classifier = TransactionClassifier()
anomaly_detector = AnomalyDetector()

class ClassifyRequest(BaseModel):
    description: str
    amount_minor: int = 0

class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    subcategory: str = "General"
    transaction_type: str = "EXPENSE"

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Financial Flow ML Engine",
        "model_loaded": classifier.pipeline is not None,
    }

@app.post("/classify", response_model=ClassifyResponse)
def classify_transaction(req: ClassifyRequest):
    category, confidence = classifier.predict(req.description)
    txn_type = "INCOME" if "Income" in category else "INVESTMENT" if "Investments" in category else "EXPENSE"
    return ClassifyResponse(
        category=category,
        confidence=confidence,
        subcategory="General",
        transaction_type=txn_type
    )

class BatchClassifyRequest(BaseModel):
    items: list[ClassifyRequest]

class BatchClassifyResponse(BaseModel):
    results: list[ClassifyResponse]

@app.post("/classify-batch", response_model=BatchClassifyResponse)
def classify_batch_endpoint(req: BatchClassifyRequest):
    descriptions = [item.description for item in req.items]
    predictions = classifier.predict_batch(descriptions)
    results = []
    for category, confidence in predictions:
        txn_type = "INCOME" if "Income" in category else "INVESTMENT" if "Investments" in category else "EXPENSE"
        results.append(ClassifyResponse(
            category=category,
            confidence=confidence,
            subcategory="General",
            transaction_type=txn_type
        ))
    return BatchClassifyResponse(results=results)

@app.post("/anomalies/score")
def score_anomalies(amounts: list[float]):
    scores = anomaly_detector.fit_and_score(amounts)
    return {"scores": scores}
