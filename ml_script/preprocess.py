"""
RetinaScan-XAI — Shared Preprocessing Pipeline
=================================================
SINGLE SOURCE OF TRUTH for all image transforms.

Every script that needs preprocessing imports from here:
    from preprocess import train_transforms, val_transforms, apply_clahe_ben_graham

Ground Rule #3: "preprocess.py is the ONLY place transforms are defined."

Preprocessing chain (inference + evaluation):
    Raw PIL Image
      → CLAHE (LAB L-channel, clipLimit=2.0, 8×8 tiles)
      → Ben Graham Normalization (GaussianBlur blend)
      → Resize 224×224
      → ToTensor
      → ImageNet Normalize

Training adds augmentation BEFORE ToTensor:
    Enhanced PIL Image
      → Resize 256×256
      → RandomCrop 224
      → RandomHorizontalFlip
      → RandomVerticalFlip
      → RandomRotation(20)
      → ColorJitter
      → ToTensor
      → ImageNet Normalize
"""

import numpy as np
import cv2
from PIL import Image
from torchvision import transforms


# ── Constants ─────────────────────────────────────────────────────────────────
IMG_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]


# ── CLAHE + Ben Graham Enhancement ───────────────────────────────────────────
def apply_clahe_ben_graham(img_pil, img_size=IMG_SIZE):
    """
    Apply CLAHE and Ben Graham normalization to a PIL Image.

    This is the core preprocessing step that standardises low-quality
    rural fundus camera images. Both training and inference MUST use this.

    Steps:
        1. Convert to LAB → apply CLAHE to L channel → convert back
        2. Ben Graham: blend with Gaussian-blurred version for
           local contrast normalization

    Args:
        img_pil:  PIL Image (RGB)
        img_size: Target resolution (default 224)

    Returns:
        PIL Image (RGB, enhanced, resized to img_size × img_size)
    """
    img = np.array(img_pil)

    # Handle grayscale / RGBA edge cases
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)

    img = cv2.resize(img, (img_size, img_size))

    # 1. CLAHE on the L channel of LAB colour space
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    img_clahe = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)

    # 2. Ben Graham Normalization (blend with blurred version)
    img_blur = cv2.GaussianBlur(img_clahe, (0, 0), img_size / 30)
    img_enhanced = cv2.addWeighted(img_clahe, 4, img_blur, -4, 128)

    return Image.fromarray(img_enhanced)


# ── Custom Transform: wraps CLAHE + Ben Graham as a torchvision transform ────
class CLAHEBenGraham:
    """Torchvision-compatible transform that applies CLAHE + Ben Graham."""
    def __init__(self, img_size=IMG_SIZE):
        self.img_size = img_size

    def __call__(self, img_pil):
        return apply_clahe_ben_graham(img_pil, self.img_size)

    def __repr__(self):
        return f"CLAHEBenGraham(img_size={self.img_size})"


# ── Training Transforms ──────────────────────────────────────────────────────
# CLAHE + Ben Graham first (so the model sees enhanced images),
# then standard augmentation.
train_transforms = transforms.Compose([
    CLAHEBenGraham(IMG_SIZE),                                  # CLAHE + Ben Graham (outputs 224×224 PIL)
    transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),         # Upscale for random crop
    transforms.RandomCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


# ── Validation / Inference Transforms ─────────────────────────────────────────
# Same CLAHE + Ben Graham, but no augmentation.
val_transforms = transforms.Compose([
    CLAHEBenGraham(IMG_SIZE),                                  # CLAHE + Ben Graham (outputs 224×224 PIL)
    transforms.Resize((IMG_SIZE, IMG_SIZE)),                   # Ensure exact size (should already be 224)
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])
