"""
ml_script/model.py
==================
Single source of truth for the RetinaScan-XAI model architecture.

RULE: build_model() must ONLY be defined here.
      train_model.py, evaluate_model.py, messidor_test.py, and
      Backend/inference.py all import from this file.
      Any change to the architecture happens HERE ONLY.
"""

import torch.nn as nn
from torchvision import models

NUM_CLASSES = 5   # ICDR grades 0-4


def build_model(num_classes: int = NUM_CLASSES) -> nn.Module:
    """
    ResNet-50 fine-tuned for 5-class Diabetic Retinopathy grading.

    Architecture:
        ResNet-50 (ImageNet pretrained backbone)
        → fc replaced with:
            Dropout(0.4)
            Linear(2048 → 512)
            ReLU()
            Dropout(0.3)
            Linear(512 → num_classes)

    Validated performance (APTOS 2019, threshold=0.1162):
        Sensitivity (Referable DR)  97.6 %
        Specificity                 89.2 %
        AUC-ROC                      0.978
        5-class Overall Accuracy    79.4 %
    """
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    in_features = model.fc.in_features          # 2048 for ResNet-50
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes),
    )
    return model
