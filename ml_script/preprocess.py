"""
ml_script/preprocess.py
========================
Single source of truth for all image transforms and preprocessing.

RULE: train_transforms, val_transforms, and apply_ben_graham_clahe()
      must ONLY be defined here.  Any change to preprocessing happens
      HERE ONLY so training and inference stay aligned.

Training pipeline  : train_transforms (augmentation + normalize)
Validation pipeline: val_transforms   (resize + normalize, NO augmentation)
Inference pipeline : val_transforms   (identical to validation — no CLAHE)

NOTE on CLAHE decision:
    The trained model (retinascan_resnet50.pth) was trained on RAW images
    with ImageNet normalization only.  The apply_ben_graham_clahe() function
    is preserved here as a utility for the MATLAB showcase and future
    retraining experiments, but is NOT called during live inference.
    Backend/inference.py uses val_transforms exclusively.
"""

import numpy as np
import cv2
from PIL import Image
from torchvision import transforms

# ── Shared constants ────────────────────────────────────────────────────────
IMG_SIZE    = 224
NUM_CLASSES = 5

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# ── Training transforms (with augmentation) ─────────────────────────────────
train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
    transforms.RandomCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# ── Validation / Inference transforms (no augmentation) ─────────────────────
val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# Alias — inference uses the same pipeline as validation
inference_transforms = val_transforms


# ── CLAHE + Ben Graham (utility — NOT used in live inference) ────────────────
def apply_ben_graham_clahe(img_pil: Image.Image, img_size: int = IMG_SIZE) -> Image.Image:
    """
    Apply CLAHE + Ben Graham normalization to a PIL image.

    Used for:
      - MATLAB showcase (preprocess_retina.m equivalent in Python)
      - Future retraining experiments where CLAHE is added to the pipeline

    NOT called during live inference against the current .pth weights.
    """
    img = np.array(img_pil.convert("RGB"), dtype=np.uint8)
    img = cv2.resize(img, (img_size, img_size))

    # CLAHE on L channel of LAB color space
    lab     = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe   = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl      = clahe.apply(l)
    img_clahe = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)

    # Ben Graham: blend with Gaussian-blurred version for local normalisation
    sigma       = img_size / 30
    img_blur    = cv2.GaussianBlur(img_clahe, (0, 0), sigma)
    img_enhanced = cv2.addWeighted(img_clahe, 4, img_blur, -4, 128)

    return Image.fromarray(img_enhanced.astype(np.uint8))
