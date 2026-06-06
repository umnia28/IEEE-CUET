from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from datetime import datetime
from zoneinfo import ZoneInfo

app = FastAPI()

model = joblib.load("risk_model.pkl")


class RiskRequest(BaseModel):
    latitude: float
    longitude: float
    district: str


def get_bd_time_features():
    now = datetime.now(ZoneInfo("Asia/Dhaka"))

    hour = now.hour
    day_of_week = now.weekday()

    if 5 <= hour < 12:
        time_of_day = "morning"
    elif 12 <= hour < 17:
        time_of_day = "afternoon"
    elif 17 <= hour < 21:
        time_of_day = "evening"
    else:
        time_of_day = "night"

    return hour, day_of_week, time_of_day


@app.get("/")
def root():
    return {
        "message": "Nirvaya risk model API is running"
    }


@app.post("/predict-risk")
def predict_risk(data: RiskRequest):
    hour, day_of_week, time_of_day = get_bd_time_features()

    input_df = pd.DataFrame([
        {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "district": data.district,
            "hour": hour,
            "day_of_week": day_of_week,
        }
    ])

    prediction = model.predict(input_df)[0]

    probabilities = {}

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(input_df)[0]
        classes = model.classes_

        for label, prob in zip(classes, proba):
            probabilities[str(label)] = round(float(prob) * 100, 2)

    high_probability = probabilities.get("high", 0)

    if prediction == "high" and high_probability >= 75:
        final_level = "critical"
    else:
        final_level = str(prediction)

    return {
        "success": True,
        "source": "model",
        "input": {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "district": data.district,
            "hour": hour,
            "day_of_week": day_of_week,
            "time_of_day": time_of_day,
        },
        "risk_level": final_level,
        "predicted_area_risk": str(prediction),
        "risk_score": high_probability,
        "probabilities": probabilities,
    }



@app.post("/predict-batch")
def predict_risk_batch(request: BatchRiskRequest):
    if not request.points:
        return {
            "success": False,
            "message": "No points provided",
            "predictions": [],
        }

    bd_time = get_bd_time()

    rows = []

    for point in request.points:
        hour = point.hour if point.hour is not None else bd_time["hour"]
        day_of_week = (
            point.day_of_week
            if point.day_of_week is not None
            else bd_time["day_of_week"]
        )

        rows.append(
            {
                "latitude": point.latitude,
                "longitude": point.longitude,
                "hour": hour,
                "day_of_week": day_of_week,
                "district": point.district,
            }
        )

    input_df = pd.DataFrame(rows)

    predictions = model.predict(input_df)
    probabilities_matrix = model.predict_proba(input_df)
    classes = model.classes_

    results = []

    for i, row in enumerate(rows):
        probabilities = {
            classes[j]: round(float(probabilities_matrix[i][j]) * 100, 2)
            for j in range(len(classes))
        }

        risk_level = predictions[i]
        risk_score = score_from_prediction(risk_level, probabilities)

        results.append(
            {
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "district": row["district"],
                "hour": row["hour"],
                "day_of_week": row["day_of_week"],
                "risk_level": risk_level,
                "predicted_area_risk": risk_level,
                "risk_score": risk_score,
                "probabilities": probabilities,
            }
        )

    return {
        "success": True,
        "source": "model",
        "count": len(results),
        "predictions": results,
    }