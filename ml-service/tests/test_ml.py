import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.classifier.model import TransactionClassifier
from app.anomaly.detector import AnomalyDetector

class TestMLService(unittest.TestCase):
    def test_classifier(self):
        clf = TransactionClassifier()
        cat, conf = clf.predict("SWIGGY BANGALORE DELIVERY")
        self.assertIsNotNone(cat)
        self.assertGreater(conf, 0.0)

    def test_anomaly(self):
        detector = AnomalyDetector()
        amounts = [100.0, 150.0, 120.0, 130.0, 110.0, 9500.0]
        scores = detector.fit_and_score(amounts)
        self.assertEqual(len(scores), 6)
        self.assertGreater(scores[5], scores[0])

if __name__ == '__main__':
    unittest.main()
