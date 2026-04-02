import os
import torch
import torch.nn as nn
import math
import numpy as np

# =====================================================
# DEVICE
# =====================================================
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Default model path (can be overridden)
MODEL_PATH = os.environ.get(
    "MODEL_PATH",
    "models/best_model.pth"
)

NUM_CLASSES = 233
INPUT_DIM = 258
SEQ_LEN = 60


# =====================================================
# POSITIONAL ENCODING
# =====================================================
class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 100):
        super().__init__()

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float32).unsqueeze(1)

        div_term = torch.exp(
            torch.arange(0, d_model, 2, dtype=torch.float32)
            * -(math.log(10000.0) / d_model)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        pe = pe.unsqueeze(0)
        self.register_buffer("pe", pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1), :]


# =====================================================
# TRANSFORMER MODEL (V2 - SAME AS TRAINING)
# =====================================================
class KeypointTransformerV2(nn.Module):
    def __init__(
        self,
        input_dim: int = INPUT_DIM,
        n_classes: int = NUM_CLASSES,
        d_model: int = 384,
        nhead: int = 8,
        num_layers: int = 4,
        dim_feedforward: int = 768,
        dropout: float = 0.2,
        max_len: int = SEQ_LEN,
    ):
        super().__init__()

        self.embed = nn.Linear(input_dim, d_model)
        self.pos_enc = PositionalEncoding(d_model, max_len)

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer, num_layers=num_layers
        )

        # CLS token
        self.cls_token = nn.Parameter(torch.zeros(1, 1, d_model))
        nn.init.normal_(self.cls_token, std=0.02)

        self.head = nn.Sequential(
            nn.LayerNorm(d_model),
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, n_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B = x.size(0)

        x = self.embed(x)
        x = self.pos_enc(x)

        cls = self.cls_token.expand(B, -1, -1)
        x = torch.cat([cls, x], dim=1)

        x = self.transformer(x)
        cls_out = x[:, 0]

        return self.head(cls_out)


# =====================================================
# LOAD MODEL
# =====================================================
def load_model(model_path: str = MODEL_PATH) -> nn.Module:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = KeypointTransformerV2()
    checkpoint = torch.load(model_path, map_location=DEVICE)

    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(DEVICE)
    model.eval()

    return model


# =====================================================
# PREDICTION FUNCTION (BACKEND USE)
# =====================================================
def predict(model: nn.Module, keypoints: np.ndarray):
    """
    keypoints: numpy array of shape (60, 258)
    returns: (predicted_class, confidence, probabilities)
    """

    if keypoints.shape != (SEQ_LEN, INPUT_DIM):
        raise ValueError(
            f"Expected shape (60, 258), got {keypoints.shape}"
        )

    x = torch.tensor(keypoints, dtype=torch.float32).unsqueeze(0)
    x = x.to(DEVICE)

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)

        conf, pred = torch.max(probs, dim=1)

    return {
        "class_id": int(pred.item()),
        "confidence": float(conf.item()),
        "probabilities": probs.cpu().numpy()[0],
    }


# =====================================================
# QUICK TEST (OPTIONAL)
# =====================================================
if __name__ == "__main__":
    print("Loading model...")
    model = load_model()
    print("Model loaded successfully!")

    dummy = np.random.randn(60, 258).astype(np.float32)
    out = predict(model, dummy)

    print("Prediction test OK")
    print(out)
