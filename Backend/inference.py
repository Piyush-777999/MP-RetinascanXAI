# Backend/inference.py
# Real ResNet-50 inference + Grad-CAM module
# Called by main.py for every uploaded image

import os
import io
import torch
import torch.nn as nn
import numpy as np
from PIL import Image
from torchvision import models, transforms
import cv2

# ─── Constants ─────────────────────────────────────────────────────────────
IMG_SIZE     = 224
NUM_CLASSES  = 5
DEVICE       = torch.device("cpu")   # CPU is fine for single-image inference ~140ms

# ICDR class info
LEVEL_LABELS = [
    "No Apparent DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR",
]
LEVEL_ACTIONS = [
    "Routine Annual Screening",
    "Review in 6–12 Months",
    "Specialist Triage Required",
    "Urgent Specialist Referral",
    "Emergency Laser / Surgical Review",
]

# ─── Preprocessing ─────────────────────────────────────────────────────────
preprocess = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

def validate_fundus(img_np):
    """Simple heuristic OOD (Out-of-Distribution) detection for non-fundus images."""
    # 1. Check corner darkness (Fundus should have a dark circular mask)
    corners_mean = np.mean([
        img_np[:20, :20], img_np[:20, -20:],
        img_np[-20:, :20], img_np[-20:, -20:]
    ])
    if corners_mean > 0.35:
        raise ValueError("OOD_REJECT: No circular retinal mask detected (Corners too bright).")

    # 2. Check center color balance (Fundus should be heavily red/orange dominant)
    # img_np is (H, W, 3) in RGB, values 0..1 or 0..255. 
    # Wait, img_np passed here will be 0..255 from PIL.
    h, w = img_np.shape[:2]
    center = img_np[h//2-30 : h//2+30, w//2-30 : w//2+30]
    r, g, b = np.mean(center[:,:,0]), np.mean(center[:,:,1]), np.mean(center[:,:,2])
    if r < g or r < b:
        raise ValueError("OOD_REJECT: Retinal pigment signature not found (Invalid color profile).")


def apply_ben_graham_clahe(img_pil, img_size):
    """Applies CLAHE and Ben Graham normalization to match the MATLAB training pipeline."""
    img = np.array(img_pil)
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        
    img = cv2.resize(img, (img_size, img_size))
    
    # 1. Apply CLAHE to the L channel of LAB color space
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    img_clahe = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)
    
    # 2. Ben Graham Normalization (blend with blurred version)
    img_blur = cv2.GaussianBlur(img_clahe, (0, 0), img_size / 30)
    img_enhanced = cv2.addWeighted(img_clahe, 4, img_blur, -4, 128)
    
    return Image.fromarray(img_enhanced)

# ─── Model Builder ─────────────────────────────────────────────────────────
def _build_model():
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


# ─── Singleton Model Loader ─────────────────────────────────────────────────
_model = None
_model_path = None

def get_model(model_path: str):
    """Load model once, reuse across requests."""
    global _model, _model_path
    if _model is None or _model_path != model_path:
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        checkpoint = torch.load(model_path, map_location=DEVICE)
        _model = _build_model().to(DEVICE)
        _model.load_state_dict(checkpoint["model_state_dict"])
        _model.eval()
        _model_path = model_path
        print(f"✅ Model loaded (epoch {checkpoint.get('epoch','?')}): {model_path}")
    return _model


# ─── Grad-CAM ──────────────────────────────────────────────────────────────
class GradCAMSimple:
    """Minimal Grad-CAM without extra dependencies."""
    def __init__(self, model):
        self.model = model
        self.gradients = None
        self.activations = None
        self._register_hooks()

    def _register_hooks(self):
        target_layer = self.model.layer4[-1]  # last ResNet block
        target_layer.register_forward_hook(self._save_activations)
        target_layer.register_full_backward_hook(self._save_gradients)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate(self, input_tensor, class_idx):
        self.model.zero_grad()
        output = self.model(input_tensor)
        output[0, class_idx].backward()

        weights = self.gradients.mean(dim=[2, 3], keepdim=True)   # [1, C, 1, 1]
        cam = (weights * self.activations).sum(dim=1, keepdim=True)  # [1, 1, H, W]
        cam = torch.relu(cam)
        cam = cam.squeeze().numpy()

        # Normalize to [0, 1]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-8:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        return cam


# ─── Main Inference Function ───────────────────────────────────────────────
def run_inference(image_bytes: bytes, model_path: str, heatmap_save_path: str):
    """
    Args:
        image_bytes: raw bytes of uploaded image
        model_path:  absolute path to retinascan_resnet50.pth
        heatmap_save_path: where to save the Grad-CAM JPEG

    Returns dict:
        severity     (int 0–4)
        confidence   (float, percentage)
        label        (str)
        action       (str)
        heatmap_url  (str, relative URL)
        all_probs    (list of 5 floats)
    """
    # Load image
    img_pil_orig  = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # OOD Validation (throws ValueError if it's a watermelon/face)
    validate_fundus(np.array(img_pil_orig) / 255.0)
    
    # Apply Ben Graham and CLAHE preprocessing
    img_pil = apply_ben_graham_clahe(img_pil_orig, IMG_SIZE)
    img_np  = np.array(img_pil) / 255.0  # for overlay

    # Preprocess
    input_tensor = preprocess(img_pil).unsqueeze(0).to(DEVICE)
    input_tensor.requires_grad_(True)

    # Load model
    model = get_model(model_path)
    grad_cam = GradCAMSimple(model)

    # Forward pass
    with torch.enable_grad():
        output = model(input_tensor)
        probs  = torch.softmax(output, dim=1).squeeze()
        grade  = int(probs.argmax().item())
        conf   = float(probs[grade].item()) * 100.0

        # Grad-CAM for predicted class
        cam = grad_cam.generate(input_tensor, grade)

    # Overlay Grad-CAM on original image
    cam_resized = cv2.resize(cam, (IMG_SIZE, IMG_SIZE))
    heatmap     = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    heatmap     = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB) / 255.0
    overlay     = (0.6 * img_np + 0.4 * heatmap).clip(0, 1)
    overlay_bgr = cv2.cvtColor(np.uint8(overlay * 255), cv2.COLOR_RGB2BGR)

    # Save heatmap
    os.makedirs(os.path.dirname(heatmap_save_path), exist_ok=True)
    cv2.imwrite(heatmap_save_path, overlay_bgr)

    heatmap_filename = os.path.basename(heatmap_save_path)

    return {
        "severity":    grade,
        "confidence":  round(conf, 1),
        "label":       LEVEL_LABELS[grade],
        "action":      LEVEL_ACTIONS[grade],
        "heatmap_url": f"/images/{heatmap_filename}",
        "all_probs":   [round(float(p), 4) for p in probs.tolist()],
    }
