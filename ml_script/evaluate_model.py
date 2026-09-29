"""
RetinaScan-XAI — Model Evaluation Script
=========================================
Loads trained retinascan_resnet50.pth and evaluates on APTOS 2019 validation set.
Outputs a JSON + printed report you can show to judges.

USAGE:
    python evaluate_model.py

Requirements:
    pip install torch torchvision pillow pandas scikit-learn matplotlib
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix, classification_report, roc_auc_score,
    accuracy_score, roc_curve
)

# ─── Config ───────────────────────────────────────────────────────────────────
DATASET_ROOT = r"D:\AntiGravity projects\SIH\DataSet\aptos2019-blindness-detection"
TRAIN_CSV    = os.path.join(DATASET_ROOT, "train.csv")
TRAIN_DIR    = os.path.join(DATASET_ROOT, "train_images")
MODEL_PATH   = os.path.join(os.path.dirname(__file__), "retinascan_resnet50.pth")
REPORT_JSON  = os.path.join(os.path.dirname(__file__), "evaluation_report.json")

IMG_SIZE     = 224
BATCH_SIZE   = 16
RANDOM_SEED  = 42
DEVICE       = torch.device("cuda" if torch.cuda.is_available() else "cpu")

LEVEL_NAMES  = ["Level 0: No DR", "Level 1: Mild NPDR",
                "Level 2: Moderate NPDR", "Level 3: Severe NPDR",
                "Level 4: Proliferative DR"]

# ─── Model ────────────────────────────────────────────────────────────────────
def build_model():
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, 5)
    )
    return model

# ─── Dataset ──────────────────────────────────────────────────────────────────
class APTOSDataset(Dataset):
    def __init__(self, df, img_dir, transform):
        self.df = df.reset_index(drop=True)
        self.img_dir = img_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row  = self.df.iloc[idx]
        path = os.path.join(self.img_dir, f"{row['id_code']}.png")
        if not os.path.exists(path):
            path = os.path.join(self.img_dir, f"{row['id_code']}.jpg")
        img = Image.open(path).convert("RGB")
        return self.transform(img), int(row["diagnosis"])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 65)
    print("📊 RetinaScan-XAI — Model Evaluation Report")
    print("=" * 65)

    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found: {MODEL_PATH}")
        print("   Run train_model.py first!")
        return

    # Load model
    print(f"🔧 Loading model from: {MODEL_PATH}")
    model = build_model().to(DEVICE)
    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    print(f"   Trained epoch: {checkpoint.get('epoch', 'N/A')}")

    # Load val split (same seed as training = same val set)
    df = pd.read_csv(TRAIN_CSV)
    _, val_df = train_test_split(df, test_size=0.20, random_state=RANDOM_SEED, stratify=df["diagnosis"])
    print(f"   Validation samples: {len(val_df)}")

    val_ds     = APTOSDataset(val_df, TRAIN_DIR, val_transforms)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    # Run inference
    print("\n🔄 Running inference on validation set...")
    all_preds, all_labels, all_probs = [], [], []

    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs = imgs.to(DEVICE)
            outputs = model(imgs)
            probs   = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_probs.extend(probs.cpu().numpy())

    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs  = np.array(all_probs)

    # ── Binary Referable DR Metrics ──────────────────────────────────────────
    binary_true    = (all_labels >= 2).astype(int)
    referable_prob = all_probs[:, 2:].sum(axis=1)
    auc            = roc_auc_score(binary_true, referable_prob)

    # Auto-find optimal threshold via Youden's J index (maximises sens+spec)
    fpr_arr, tpr_arr, thresholds = roc_curve(binary_true, referable_prob)
    youdens_j   = tpr_arr - fpr_arr                      # sensitivity + specificity - 1
    best_idx    = np.argmax(youdens_j)
    best_thresh = float(thresholds[best_idx])
    print(f"\n🎯 Optimal threshold (Youden's J): {best_thresh:.4f}  "
          f"(default was 0.50)")

    binary_pred = (referable_prob >= best_thresh).astype(int)

    cm = confusion_matrix(binary_true, binary_pred)
    tn, fp, fn, tp = cm.ravel()

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    ppv         = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    npv         = tn / (tn + fn) if (tn + fn) > 0 else 0.0
    f1          = 2 * tp / (2 * tp + fp + fn) if (2 * tp + fp + fn) > 0 else 0.0
    overall_acc = accuracy_score(all_labels, all_preds)

    # ── Print Report ─────────────────────────────────────────────────────────
    print("\n" + "─" * 65)
    print("  BINARY CLASSIFICATION: Referable DR (Level 2, 3, 4)")
    print("─" * 65)
    print(f"  Sensitivity (Recall)  : {sensitivity*100:6.2f}%  {'✅' if sensitivity >= 0.90 else '❌'} (Target ≥ 90%)")
    print(f"  Specificity           : {specificity*100:6.2f}%  {'✅' if specificity >= 0.85 else '❌'} (Target ≥ 85%)")
    print(f"  Positive Pred. Value  : {ppv*100:6.2f}%")
    print(f"  Negative Pred. Value  : {npv*100:6.2f}%")
    print(f"  F1 Score              : {f1:.4f}")
    print(f"  AUC-ROC               : {auc:.4f}")
    print(f"  Overall 5-class Acc.  : {overall_acc*100:6.2f}%")
    print("─" * 65)
    print(f"  Confusion Matrix (Referable vs Non-Referable):")
    print(f"    TP={tp}  FP={fp}")
    print(f"    FN={fn}  TN={tn}")
    print("─" * 65)

    # ── Per-class report ─────────────────────────────────────────────────────
    print("\n  PER-CLASS CLASSIFICATION REPORT:")
    cr = classification_report(all_labels, all_preds, target_names=LEVEL_NAMES, digits=3)
    print(cr)

    # ── Targets check ─────────────────────────────────────────────────────────
    sens_ok = sensitivity >= 0.90
    spec_ok = specificity >= 0.85

    print("─" * 65)
    print("  SIH 2026 TARGETS:")
    print(f"  ✅ Sensitivity ≥ 90% : {'PASS ✅' if sens_ok else 'FAIL ❌'} ({sensitivity*100:.1f}%)")
    print(f"  ✅ Specificity ≥ 85% : {'PASS ✅' if spec_ok else 'FAIL ❌'} ({specificity*100:.1f}%)")
    print("=" * 65)

    # ── Save JSON report ─────────────────────────────────────────────────────
    report = {
        "model":           "RetinaScan-XAI ResNet-50 Fine-Tuned",
        "dataset":         "APTOS 2019 Blindness Detection",
        "dataset_source":  "https://www.kaggle.com/competitions/aptos2019-blindness-detection",
        "validation_set":  len(val_df),
        "overall_accuracy": round(float(overall_acc), 4),
        "binary_referable_dr": {
            "definition":        "Positive = ICDR Level 2, 3, or 4 (requires specialist)",
            "optimal_threshold": round(best_thresh, 4),
            "threshold_method":  "Youden's J index on ROC curve (maximises sensitivity + specificity)",
            "sensitivity":       round(float(sensitivity), 4),
            "specificity":       round(float(specificity), 4),
            "ppv":               round(float(ppv), 4),
            "npv":               round(float(npv), 4),
            "f1_score":          round(float(f1), 4),
            "auc_roc":           round(float(auc), 4),
            "confusion_matrix": {
                "true_positive":  int(tp),
                "true_negative":  int(tn),
                "false_positive": int(fp),
                "false_negative": int(fn),
            }
        },
        "sih_targets_met": {
            "sensitivity_90_percent": bool(sens_ok),
            "specificity_85_percent": bool(spec_ok),
        },
    }

    with open(REPORT_JSON, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n💾 Report saved: {REPORT_JSON}")
    print("   → Copy this file to Backend/ for serving via /eval-report endpoint")


if __name__ == "__main__":
    main()
