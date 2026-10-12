# ml_script/train_classifier_v2.py
# RetinaScan-XAI ResNet-50 Classifier v2
# ─────────────────────────────────────────────────────────────────────────────
# Trains on APTOS 2019 (all 3662) + MESSIDOR-2 (1744 gradable) = 5406 images
# 80% train (4325) / 20% val (1081) — val set is REQUIRED for honest metrics
# Mixed-precision GPU training (AMP), Youden-J threshold evaluation
# Checkpoint resume: if training is interrupted, re-run the same command
#
# Run from repo root:
#   ml_script/train_env/Scripts/python.exe ml_script/train_classifier_v2.py
#
# Outputs:
#   ml_script/checkpoints/classifier_epoch_XX.pth  (every 5 epochs)
#   ml_script/retinascan_resnet50_v2.pth            (best val loss, final)
#   ml_script/val_ids_v2.csv                        (frozen val set)
#   ml_script/evaluation_report_v2.json             (sensitivity, specificity)

import os, sys, json, time, random, copy
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_curve, auc, confusion_matrix
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import models, transforms

# ── Paths ──────────────────────────────────────────────────────────────────────
DATASET_BASE = os.environ.get("DATASET_BASE", os.path.join(REPO, "dataset"))
APTOS_CSV  = os.environ.get("APTOS_CSV", os.path.join(DATASET_BASE, "aptos2019-blindness-detection", "train.csv"))
APTOS_IMGS = os.environ.get("APTOS_IMGS", os.path.join(DATASET_BASE, "aptos2019-blindness-detection", "train_images"))
MESS_CSV   = os.environ.get("MESS_CSV", os.path.join(DATASET_BASE, "messidor", "messidor_data.xls"))
MESS_IMGS  = os.environ.get("MESS_IMGS", os.path.join(DATASET_BASE, "messidor", "IMAGES.zip", "IMAGES"))
CKPT_DIR   = os.path.join(REPO, "ml_script", "checkpoints")
CKPT_LATEST= os.path.join(CKPT_DIR, "classifier_latest.pth")
OUT_PTH    = os.path.join(REPO, "ml_script", "retinascan_resnet50_v2.pth")
OUT_CSV    = os.path.join(REPO, "ml_script", "val_ids_v2.csv")
OUT_REPORT = os.path.join(REPO, "ml_script", "evaluation_report_v2.json")
os.makedirs(CKPT_DIR, exist_ok=True)

# ── Hyperparameters ────────────────────────────────────────────────────────────
IMG_SIZE     = 224
BATCH_SIZE   = 24
EPOCHS       = 25
LR           = 1e-4
WEIGHT_DECAY = 1e-4
NUM_CLASSES  = 5
SEED         = 42
CKPT_EVERY   = 5    # save checkpoint every N epochs

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[init] Device: {DEVICE}")
if DEVICE.type == "cuda":
    props = torch.cuda.get_device_properties(0)
    print(f"[init] GPU: {props.name} | VRAM: {props.total_memory/1e9:.1f} GB")

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# ── Load datasets ──────────────────────────────────────────────────────────────
print("[data] Loading APTOS 2019...")
aptos = pd.read_csv(APTOS_CSV)
aptos["image_path"] = aptos["id_code"].apply(lambda x: os.path.join(APTOS_IMGS, x + ".png"))
aptos = aptos.rename(columns={"diagnosis": "label"})[["image_path", "label"]]
aptos["source"] = "aptos"

print("[data] Loading MESSIDOR-2...")
mess = pd.read_csv(MESS_CSV)
mess = mess[mess["adjudicated_gradable"] == 1].copy()
mess["image_path"] = mess["id_code"].apply(lambda x: os.path.join(MESS_IMGS, x))
mess = mess.rename(columns={"diagnosis": "label"})[["image_path", "label"]]
mess["source"] = "messidor"

for name, df in [("APTOS", aptos), ("MESSIDOR", mess)]:
    found = sum(os.path.exists(p) for p in df["image_path"])
    print(f"[data] {name}: {found}/{len(df)} images found on disk")

aptos = aptos[aptos["image_path"].apply(os.path.exists)].reset_index(drop=True)
mess  = mess[mess["image_path"].apply(os.path.exists)].reset_index(drop=True)
print(f"[data] APTOS total: {len(aptos)} | MESSIDOR total: {len(mess)}")

# ── Per-dataset independent 80/20 stratified split ────────────────────────────
# Each dataset contributes its OWN 20% to the val set independently.
# This prevents the val set from being biased toward one dataset.
#   APTOS  : 2930 train + 732 val
#   MESSIDOR: 1395 train + 349 val
#   TOTAL  : 4325 train + 1081 val
#
# The val set is FROZEN after first run and reloaded on resume.
if os.path.exists(OUT_CSV):
    val_df    = pd.read_csv(OUT_CSV)
    val_paths = set(val_df["image_path"])
    all_imgs  = pd.concat([aptos, mess], ignore_index=True)
    train_df  = all_imgs[~all_imgs["image_path"].isin(val_paths)].reset_index(drop=True)
    val_df    = val_df[val_df["image_path"].apply(os.path.exists)].reset_index(drop=True)
    print(f"[data] Reloaded frozen split -> Train: {len(train_df)} | Val: {len(val_df)}")
else:
    # Split APTOS 80/20 independently
    tr_a, va_a = train_test_split(aptos, test_size=0.20,
                                  random_state=SEED, stratify=aptos["label"])
    # Split MESSIDOR 80/20 independently
    tr_m, va_m = train_test_split(mess,  test_size=0.20,
                                  random_state=SEED, stratify=mess["label"])
    train_df = pd.concat([tr_a, tr_m], ignore_index=True).reset_index(drop=True)
    val_df   = pd.concat([va_a, va_m], ignore_index=True).reset_index(drop=True)
    val_df.to_csv(OUT_CSV, index=False)
    print(f"[data] New per-dataset split:")
    print(f"         APTOS  -> Train: {len(tr_a)} | Val: {len(va_a)}")
    print(f"         MESSIDOR -> Train: {len(tr_m)} | Val: {len(va_m)}")
    print(f"         TOTAL  -> Train: {len(train_df)} | Val: {len(val_df)}")
    print(f"[data] Frozen val set saved -> {OUT_CSV}")

# ── CLAHE + Ben Graham ─────────────────────────────────────────────────────────
def apply_clahe_ben_graham(img_pil, size=IMG_SIZE):
    import cv2
    img = np.array(img_pil.convert("RGB"), dtype=np.uint8)
    img = cv2.resize(img, (size, size))
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    cl = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
    enhanced = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2RGB)
    blur = cv2.GaussianBlur(enhanced, (0, 0), size / 30)
    out  = np.clip(cv2.addWeighted(enhanced, 4, blur, -4, 128), 0, 255).astype(np.uint8)
    return Image.fromarray(out)

norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
train_tf = transforms.Compose([
    transforms.RandomHorizontalFlip(), transforms.RandomVerticalFlip(),
    transforms.RandomRotation(20),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
    transforms.ToTensor(), norm,
])
val_tf = transforms.Compose([transforms.ToTensor(), norm])

# ── Dataset ────────────────────────────────────────────────────────────────────
class FundusDataset(Dataset):
    def __init__(self, df, transform, enhance=True):
        self.df = df; self.transform = transform; self.enhance = enhance
    def __len__(self): return len(self.df)
    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        try:
            img = Image.open(row["image_path"]).convert("RGB")
            img = apply_clahe_ben_graham(img) if self.enhance else img.resize((IMG_SIZE, IMG_SIZE))
        except Exception:
            img = Image.new("RGB", (IMG_SIZE, IMG_SIZE))
        return self.transform(img), int(row["label"])

train_loader = DataLoader(FundusDataset(train_df, train_tf), batch_size=BATCH_SIZE,
                          shuffle=True,  num_workers=0, pin_memory=True)
val_loader   = DataLoader(FundusDataset(val_df, val_tf),     batch_size=BATCH_SIZE,
                          shuffle=False, num_workers=0, pin_memory=True)

# ── Model ──────────────────────────────────────────────────────────────────────
model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
model.fc = nn.Sequential(
    nn.Dropout(0.4), nn.Linear(model.fc.in_features, 512),
    nn.ReLU(), nn.Dropout(0.3), nn.Linear(512, NUM_CLASSES),
)
model = model.to(DEVICE)
print(f"[model] ResNet-50 params: {sum(p.numel() for p in model.parameters())/1e6:.2f}M")

counts = train_df["label"].value_counts().sort_index().values.astype(float)
cw = torch.tensor(1.0 / counts, dtype=torch.float32).to(DEVICE)
cw = cw / cw.sum() * NUM_CLASSES
criterion = nn.CrossEntropyLoss(weight=cw)
optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
scheduler = torch.optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=10)
use_amp   = DEVICE.type == "cuda"
scaler    = torch.amp.GradScaler("cuda") if use_amp else None

# ── Resume from checkpoint if it exists ───────────────────────────────────────
start_epoch  = 1
best_loss    = float("inf")
best_state   = None
history      = []

if os.path.exists(CKPT_LATEST):
    print(f"\n[resume] Found checkpoint: {CKPT_LATEST}")
    ckpt = torch.load(CKPT_LATEST, map_location=DEVICE)
    model.load_state_dict(ckpt["model_state_dict"])
    optimizer.load_state_dict(ckpt["optimizer_state"])
    scheduler.load_state_dict(ckpt["scheduler_state"])
    if use_amp and "scaler_state" in ckpt and ckpt["scaler_state"]:
        scaler.load_state_dict(ckpt["scaler_state"])
    start_epoch = ckpt["epoch"] + 1
    best_loss   = ckpt.get("best_loss", float("inf"))
    history     = ckpt.get("history", [])
    best_state  = ckpt.get("best_state")   # may be None if no best saved yet
    print(f"[resume] Resuming from epoch {start_epoch} | Best loss so far: {best_loss:.4f}")
else:
    print("[train] No checkpoint found — starting fresh.")

# ── Training loop ──────────────────────────────────────────────────────────────
print(f"\n[train] Epochs {start_epoch} -> {EPOCHS} on {DEVICE}")
print(f"[train] Train set: {len(train_df)} images | Val set: {len(val_df)} images")
print(f"[train] Val set is 20% held-out — never seen during training")
print("-" * 75)

for epoch in range(start_epoch, EPOCHS + 1):
    model.train()
    tl, tc, tt = 0.0, 0, 0
    t0 = time.time()
    for imgs, labels in train_loader:
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        if use_amp:
            with torch.amp.autocast("cuda"):
                out = model(imgs); loss = criterion(out, labels)
            scaler.scale(loss).backward()
            scaler.step(optimizer); scaler.update()
        else:
            out = model(imgs); loss = criterion(out, labels)
            loss.backward(); optimizer.step()
        tl += loss.item() * imgs.size(0)
        tc += (out.argmax(1) == labels).sum().item()
        tt += imgs.size(0)
    scheduler.step()

    model.eval()
    vl, vc, vt = 0.0, 0, 0
    with torch.no_grad():
        for imgs, labels in val_loader:
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            out = model(imgs); loss = criterion(out, labels)
            vl += loss.item() * imgs.size(0)
            vc += (out.argmax(1) == labels).sum().item()
            vt += imgs.size(0)
    vl /= vt

    elapsed = time.time() - t0
    print(f"Ep {epoch:02d}/{EPOCHS} | "
          f"TrL={tl/tt:.4f} TrAcc={tc/tt:.3f} | "
          f"VaL={vl:.4f} VaAcc={vc/vt:.3f} | "
          f"LR={scheduler.get_last_lr()[0]:.2e} | {elapsed:.0f}s")

    hist_entry = {"epoch": epoch, "train_loss": tl/tt, "val_loss": vl, "val_acc": vc/vt}
    history.append(hist_entry)

    if vl < best_loss:
        best_loss  = vl
        best_state = copy.deepcopy(model.state_dict())
        print(f"  -> Best val_loss={best_loss:.4f} — best model updated")

    # ── Save checkpoint every N epochs (and always on improvement) ─────────────
    if epoch % CKPT_EVERY == 0 or vl == best_loss or epoch == EPOCHS:
        ckpt_path = os.path.join(CKPT_DIR, f"classifier_epoch_{epoch:02d}.pth")
        ckpt_data = {
            "epoch":           epoch,
            "model_state_dict":model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "scheduler_state": scheduler.state_dict(),
            "scaler_state":    scaler.state_dict() if use_amp else None,
            "best_loss":       best_loss,
            "best_state":      best_state,
            "history":         history,
        }
        torch.save(ckpt_data, ckpt_path)
        torch.save(ckpt_data, CKPT_LATEST)   # always overwrite latest
        print(f"  [ckpt] Saved -> {ckpt_path}")

# ── Save final best model ──────────────────────────────────────────────────────
torch.save({"epoch": EPOCHS, "model_state_dict": best_state,
            "val_loss": best_loss, "history": history,
            "datasets": ["aptos2019", "messidor2"],
            "train_count": len(train_df), "val_count": len(val_df)}, OUT_PTH)
print(f"\n[save] Best model -> {OUT_PTH}")

# ── Final evaluation on val set ────────────────────────────────────────────────
model.load_state_dict(best_state)
model.eval()
all_probs, all_labels = [], []
with torch.no_grad():
    for imgs, labels in val_loader:
        out = model(imgs.to(DEVICE))
        all_probs.extend(torch.softmax(out, 1).cpu().numpy())
        all_labels.extend(labels.numpy())

all_labels = np.array(all_labels)
all_probs  = np.array(all_probs)

binary_true    = (all_labels >= 2).astype(int)
referable_prob = all_probs[:, 2:].sum(axis=1)

fpr, tpr, thresholds = roc_curve(binary_true, referable_prob)
auc_score  = auc(fpr, tpr)
best_j     = np.argmax(tpr - fpr)
opt_thresh = float(thresholds[best_j])
sens       = float(tpr[best_j])
spec       = float(1 - fpr[best_j])

pred       = (referable_prob >= opt_thresh).astype(int)
tn, fp, fn, tp = confusion_matrix(binary_true, pred).ravel()
ppv  = tp / (tp + fp) if (tp + fp) > 0 else 0.0
npv  = tn / (tn + fn) if (tn + fn) > 0 else 0.0
f1   = 2 * tp / (2 * tp + fp + fn) if (2 * tp + fp + fn) > 0 else 0.0
acc5 = (all_probs.argmax(1) == all_labels).mean()

report = {
    "model":   "RetinaScan-XAI ResNet-50 v2",
    "note":    "Trained on 80% of APTOS and 80% of MESSIDOR independently. Val 20% from each dataset held-out for evaluation.",
    "datasets":["APTOS 2019 (3662 images)", "MESSIDOR-2 (1744 gradable images)"],
    "train_count":    len(train_df),
    "validation_set": len(val_df),
    "overall_accuracy": round(float(acc5), 4),
    "binary_referable_dr": {
        "definition":        "Positive = ICDR Level 2, 3, or 4",
        "optimal_threshold": round(opt_thresh, 4),
        "threshold_method":  "Youden's J index on ROC curve",
        "sensitivity":       round(sens, 4),
        "specificity":       round(spec, 4),
        "ppv":               round(ppv, 4),
        "npv":               round(npv, 4),
        "f1_score":          round(f1, 4),
        "auc_roc":           round(auc_score, 4),
        "confusion_matrix":  {"true_positive": int(tp), "true_negative": int(tn),
                              "false_positive": int(fp), "false_negative": int(fn)},
    },
    "benchmark_targets_met": {
        "sensitivity_90_percent": sens >= 0.90,
        "specificity_85_percent": spec >= 0.85,
    },
}
with open(OUT_REPORT, "w") as f:
    json.dump(report, f, indent=2)

print(f"\n[RESULT] Sensitivity : {sens*100:.2f}%")
print(f"[RESULT] Specificity : {spec*100:.2f}%")
print(f"[RESULT] AUC-ROC     : {auc_score:.4f}")
print(f"[RESULT] Threshold   : {opt_thresh:.4f}")
print(f"[RESULT] Benchmark Sens>=90%: {sens >= 0.90}  |  Benchmark Spec>=85%: {spec >= 0.85}")
print(f"[RESULT] Report -> {OUT_REPORT}")
print("\n[done] Training complete!")
