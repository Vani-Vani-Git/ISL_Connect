from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import json
from sqlalchemy.orm import Session
from database import engine
from models import User
from auth import hash_password, verify_password, create_access_token
from schemas import SignupRequest, LoginRequest
from database import get_db

from model import load_model, predict
User.metadata.create_all(bind=engine)

# -----------------------
# App + CORS
# -----------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------
# Load model (ONCE)
# -----------------------
model = load_model()

# -----------------------
# Load label mapping
# -----------------------
with open("C:/Users/VANITHA/Desktop/ISLConnect/label2idx.json", "r") as f:
    label2idx = json.load(f)

idx2label = {v: k for k, v in label2idx.items()}

# -----------------------
# Request schema
# -----------------------
class PredictRequest(BaseModel):
    keypoints: list  # expected shape: [60, 258]

# -----------------------
# Predict endpoint
# -----------------------
@app.post("/predict")
async def predict_api(req: PredictRequest):
    try:
        keypoints = np.array(req.keypoints, dtype=np.float32)

        result = predict(model, keypoints)

        class_id = int(result["class_id"])
        confidence = float(result["confidence"])

        label = idx2label.get(class_id, "Unknown")

        return {
            "label": label,
            "confidence": confidence
        }

    except Exception as e:
        return {"error": str(e)}

# -----------------------
# Health check
# -----------------------

@app.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=req.email,
        hashed_password=hash_password(req.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/")
def root():
    return {"status": "Backend running"}
