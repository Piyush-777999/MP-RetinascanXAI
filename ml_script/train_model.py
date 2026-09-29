"""
RetinaScan-XAI — ResNet-50 Training Script
===========================================
Trains ResNet-50 on APTOS 2019 Blindness Detection dataset.
Outputs: retinascan_resnet50.pth (model weights)

USAGE:
    pip install torch torchvision pillow pandas scikit-learn tqdm
    python train_model.py

Expects dataset at:
    D:/AntiGravity projects/SIH/DataSet/aptos2019-blindness-detection/
        train.csv
        train_images/  (contains *.png files)
"""

import os
import sys
import json
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms
from PIL import Image
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix, classification_report,
    roc_auc_score, accuracy_score
)
from tqdm import tqdm

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
DATASET_ROOT = r"D:\AntiGravity projects\SIH\DataSet\aptos2019-blindness-detection"
TRAIN_CSV    = os.path.join(DATASET_ROOT, "train.csv")
TRAIN_DIR    = os.path.join(DATASET_ROOT, "train_images")
OUTPUT_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_SAVE   = os.path.join(OUTPUT_DIR, "retinascan_resnet50.pth")
EVAL_JSON    = os.path.join(OUTPUT_DIR, "evaluation_report.json")

IMG_SIZE     = 224
BATCH_SIZE   = 16          # reduce to 8 if you get out-of-memory errors
NUM_EPOCHS   = 20          # ~2-3 hours on CPU, ~25 min on GPU
NUM_CLASSES  = 5
VAL_SPLIT    = 0.20        # 20% held out for validation
RANDOM_SEED  = 42
LEARNING_RATE = 1e-4

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🖥  Device: {DEVICE}")
if torch.cuda.is_available():
    print(f"   GPU: {torch.cuda.get_device_name(0)}")

# ─────────────────────────────────────────────────────────────────────────────
# DATASET CLASS
# ─────────────────────────────────────────────────────────────────────────────
class APTOSDataset(Dataset):
    def __init__(self, df, img_dir, transform=None):
        self.df        = df.reset_index(drop=True)
        self.img_dir   = img_dir
        self.transform = transform

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row      = self.df.iloc[idx]
        img_name = row["id_code"]
        label    = int(row["diagnosis"])

        # Try .png first, then .jpg
        img_path = os.path.join(self.img_dir, f"{img_name}.png")
        if not os.path.exists(img_path):
            img_path = os.path.join(self.img_dir, f"{img_name}.jpg")

        img = Image.open(img_path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

# ─────────────────────────────────────────────────────────────────────────────
# DATA AUGMENTATION
# ─────────────────────────────────────────────────────────────────────────────
train_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE + 32, IMG_SIZE + 32)),
    transforms.RandomCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

val_transforms = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ─────────────────────────────────────────────────────────────────────────────
# MODEL
# ─────────────────────────────────────────────────────────────────────────────
def build_model(num_classes=5):
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
    # Replace final layer: 2048 → num_classes
    model.fc = nn.Sequential(
        nn.Dropout(0.4),
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, num_classes)
    )
    return model

# ─────────────────────────────────────────────────────────────────────────────
# CLASS WEIGHTS (handles imbalanced dataset)
# ─────────────────────────────────────────────────────────────────────────────
def get_class_weights(df):
    counts   = df["diagnosis"].value_counts().sort_index()
    total    = len(df)
    weights  = total / (NUM_CLASSES * counts.values)
    weights  = torch.FloatTensor(weights).to(DEVICE)
    return weights

# ─────────────────────────────────────────────────────────────────────────────
# TRAINING LOOP
# ─────────────────────────────────────────────────────────────────────────────
def train_one_epoch(model, loader, optimizer, criterion):
    model.train()
    running_loss = 0.0
    correct = 0
    total   = 0

    for imgs, labels in tqdm(loader, desc="  Training", leave=False):
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(imgs)
        loss    = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * imgs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total   += labels.size(0)

    return running_loss / total, correct / total

# ─────────────────────────────────────────────────────────────────────────────
# VALIDATION LOOP
# ─────────────────────────────────────────────────────────────────────────────
def validate(model, loader, criterion):
    model.eval()
    running_loss = 0.0
    all_preds   = []
    all_labels  = []
    all_probs   = []

    with torch.no_grad():
        for imgs, labels in tqdm(loader, desc="  Validating", leave=False):
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            outputs = model(imgs)
            loss    = criterion(outputs, labels)
            probs   = torch.softmax(outputs, dim=1)

            running_loss  += loss.item() * imgs.size(0)
            _, preds = torch.max(outputs, 1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())

    avg_loss  = running_loss / len(loader.dataset)
    accuracy  = accuracy_score(all_labels, all_preds)
    return avg_loss, accuracy, np.array(all_labels), np.array(all_preds), np.array(all_probs)

# ─────────────────────────────────────────────────────────────────────────────
# SENSITIVITY & SPECIFICITY CALCULATION
# ─────────────────────────────────────────────────────────────────────────────
def compute_binary_metrics(all_labels, all_probs):
    """
    Binary: referable DR = level 2, 3, 4 → positive
            healthy/mild  = level 0, 1   → negative
    """
    binary_true  = (all_labels >= 2).astype(int)
    # Probability of referable DR = sum of P(2) + P(3) + P(4)
    referable_prob = all_probs[:, 2:].sum(axis=1)
    binary_pred  = (referable_prob >= 0.5).astype(int)

    cm = confusion_matrix(binary_true, binary_pred)
    tn, fp, fn, tp = cm.ravel()

    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0.0  # recall
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    ppv         = tp / (tp + fp) if (tp + fp) > 0 else 0.0   # precision
    f1          = 2 * (sensitivity * ppv) / (sensitivity + ppv) if (sensitivity + ppv) > 0 else 0.0

    try:
        auc = roc_auc_score(binary_true, referable_prob)
    except Exception:
        auc = 0.0

    return {
        "sensitivity": round(float(sensitivity), 4),
        "specificity":  round(float(specificity), 4),
        "ppv":          round(float(ppv), 4),
        "f1":           round(float(f1), 4),
        "auc_roc":      round(float(auc), 4),
        "confusion_matrix": {
            "TP": int(tp), "TN": int(tn),
            "FP": int(fp), "FN": int(fn)
        }
    }

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("🚀 RetinaScan-XAI — ResNet-50 Training")
    print("=" * 60)

    # Load CSV
    print(f"\n📁 Loading dataset from:\n   {TRAIN_CSV}")
    df = pd.read_csv(TRAIN_CSV)
    print(f"   Total samples: {len(df)}")
    print(f"   Class distribution:\n{df['diagnosis'].value_counts().sort_index().to_string()}")

    # Train / val split (stratified)
    train_df, val_df = train_test_split(
        df, test_size=VAL_SPLIT, random_state=RANDOM_SEED, stratify=df["diagnosis"]
    )
    print(f"\n   Train: {len(train_df)} | Val: {len(val_df)}")

    # Datasets & loaders
    train_ds = APTOSDataset(train_df, TRAIN_DIR, train_transforms)
    val_ds   = APTOSDataset(val_df,   TRAIN_DIR, val_transforms)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=2)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=2)

    # Model
    model = build_model(NUM_CLASSES).to(DEVICE)
    print(f"\n🔧 Model: ResNet-50 (ImageNet pretrained)")

    # Class-weighted loss
    class_weights = get_class_weights(train_df)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    # Optimizer + scheduler
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)

    # Training
    best_val_acc  = 0.0
    best_metrics  = {}
    history       = []

    print(f"\n🏋️  Training for {NUM_EPOCHS} epochs...")
    start_time = time.time()

    for epoch in range(1, NUM_EPOCHS + 1):
        print(f"\nEpoch [{epoch:02d}/{NUM_EPOCHS}]")

        train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, criterion)
        val_loss, val_acc, y_true, y_pred, y_probs = validate(model, val_loader, criterion)
        scheduler.step()

        binary_metrics = compute_binary_metrics(y_true, y_probs)

        print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc*100:.1f}%")
        print(f"  Val   Loss: {val_loss:.4f}   | Val   Acc: {val_acc*100:.1f}%")
        print(f"  Sensitivity: {binary_metrics['sensitivity']*100:.1f}%  "
              f"Specificity: {binary_metrics['specificity']*100:.1f}%  "
              f"AUC: {binary_metrics['auc_roc']:.3f}")

        history.append({
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc":  round(train_acc, 4),
            "val_loss":   round(val_loss, 4),
            "val_acc":    round(val_acc, 4),
            **binary_metrics
        })

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_metrics = binary_metrics
            torch.save({
                "epoch":      epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc":    val_acc,
                "metrics":    binary_metrics,
            }, MODEL_SAVE)
            print(f"  ✅ Best model saved! (val_acc={val_acc*100:.1f}%)")

    elapsed = time.time() - start_time
    print(f"\n⏱  Training completed in {elapsed/60:.1f} minutes")

    # Final evaluation report
    print(f"\n📊 Final Best Model Metrics:")
    print(f"   Sensitivity : {best_metrics['sensitivity']*100:.1f}%")
    print(f"   Specificity : {best_metrics['specificity']*100:.1f}%")
    print(f"   AUC-ROC     : {best_metrics['auc_roc']:.3f}")
    print(f"   F1 Score    : {best_metrics['f1']:.3f}")

    # Check if we meet the SIH targets
    sens_ok = best_metrics["sensitivity"] >= 0.90
    spec_ok = best_metrics["specificity"] >= 0.85
    print(f"\n   ✅ Sensitivity ≥ 90%: {'PASS ✅' if sens_ok else 'FAIL ❌ (retrain needed)'}")
    print(f"   ✅ Specificity ≥ 85%: {'PASS ✅' if spec_ok else 'FAIL ❌ (retrain needed)'}")

    # Save evaluation report
    report = {
        "model":         "ResNet-50 fine-tuned",
        "dataset":       "APTOS 2019 Blindness Detection",
        "val_samples":   len(val_df),
        "train_samples": len(train_df),
        "best_epoch":    int(best_val_acc),
        "val_accuracy":  round(float(best_val_acc), 4),
        "binary_referable_dr": best_metrics,
        "targets_met":   { "sensitivity_90": sens_ok, "specificity_85": spec_ok },
        "training_history": history,
    }
    with open(EVAL_JSON, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n📄 Evaluation report saved: {EVAL_JSON}")
    print(f"🏆 Model saved: {MODEL_SAVE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
