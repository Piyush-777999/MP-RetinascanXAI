"""
RetinaScan-XAI — Shared Model Definition
==========================================
SINGLE SOURCE OF TRUTH for the ResNet-50 architecture.

Every script that needs the model imports from here:
    from model import build_model

Ground Rule #2: "model.py is the ONLY place build_model() exists."
"""

import torch.nn as nn
from torchvision import models


def build_model(num_classes=5, pretrained=True):
    """
    Build the RetinaScan-XAI ResNet-50 model.

    Args:
        num_classes: Number of output classes (default: 5 for ICDR 0–4).
        pretrained:  If True, load ImageNet weights (for training).
                     If False, initialise randomly (for loading a .pth checkpoint).

    Returns:
        torchvision ResNet-50 with custom fc head:
            Dropout(0.4) → Linear(2048, 512) → ReLU → Dropout(0.3) → Linear(512, num_classes)
    """
    weights = models.ResNet50_Weights.DEFAULT if pretrained else None
    model = models.resnet50(weights=weights)

    # Replace final fully-connected layer
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes),
    )
    return model
