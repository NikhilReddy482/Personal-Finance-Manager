# Machine Learning Classification & Anomaly Architecture

## Transaction Classifier
- **Feature Extraction**: TF-IDF Vectorizer with unigrams and bigrams (`ngram_range=(1, 2)`), sublinear TF scaling, and lowercase normalization.
- **Model**: Logistic Regression with balanced class weights.
- **Microservice**: FastAPI app serving `/classify` and `/anomalies/score`.
- **Training Artifact**: Saved to `models/classifier_pipeline.joblib`.

## Anomaly Detection
- **Model**: `IsolationForest` with statistical z-score amount deviation filters.
- **Explanation Signals**: Ratio of transaction amount to category average and historical frequency.
