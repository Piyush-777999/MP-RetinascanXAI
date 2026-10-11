# ml_script/train_lesion_seg.py
# U-Net Lesion Segmentation — IDRiD Dataset
# Trains on 54 annotated fundus images with pixel-level masks for:
#   Microaneurysms (MA), Haemorrhages (HE), Hard Exudates (EX)
# Checkpoint resume: re-run the same command after a crash to continue
# Outputs: ml_script/lesion_unet.pth  |  ml_script/checkpoints/lesion_latest.pth
#
# Run from repo root:
#   ml_script/train_env/Scripts/python.exe ml_script/train_lesion_seg.py

import os, json, time, copy
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDRID_BASE = r"D:\AntiGravity projects\MP-RetinascanXAI\dataset\IDRid\A. Segmentation\A. Segmentation"
TRAIN_IMGS = os.path.join(IDRID_BASE, "1. Original Images", "a. Training Set")
TEST_IMGS  = os.path.join(IDRID_BASE, "1. Original Images", "b. Testing Set")
MASKS_BASE = os.path.join(IDRID_BASE, "2. All Segmentation Groundtruths")
CKPT_DIR   = os.path.join(REPO, "ml_script", "checkpoints")
CKPT_LATEST= os.path.join(CKPT_DIR, "lesion_latest.pth")
OUT_PTH    = os.path.join(REPO, "ml_script", "lesion_unet.pth")
OUT_REPORT = os.path.join(REPO, "ml_script", "lesion_seg_report.json")
os.makedirs(CKPT_DIR, exist_ok=True)

# ── Config ─────────────────────────────────────────────────────────────────────
IMG_SIZE   = 512    # IDRiD images are 4288x2848; we tile/resize
BATCH_SIZE = 4      # 512x512 U-Net on 8GB VRAM
EPOCHS     = 60
LR         = 1e-4
SEED       = 42
CKPT_EVERY = 10    # save checkpoint every N epochs
# Classes: background(0), MA(1), HE(2), EX-hard(3)
NUM_CLASSES = 4
CLASS_NAMES = ["background", "microaneurysm", "haemorrhage", "hard_exudate"]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[init] Device: {DEVICE}")
if DEVICE.type == "cuda":
    print(f"[init] GPU: {torch.cuda.get_device_name(0)}")

torch.manual_seed(SEED)
np.random.seed(SEED)

# ── IDRiD Dataset ──────────────────────────────────────────────────────────────
MASK_DIRS = {
    "train": {
        "ma": os.path.join(MASKS_BASE, "a. Training Set", "1. Microaneurysms"),
        "he": os.path.join(MASKS_BASE, "a. Training Set", "2. Haemorrhages"),
        "ex": os.path.join(MASKS_BASE, "a. Training Set", "3. Hard Exudates"),
    },
    "test": {
        "ma": os.path.join(MASKS_BASE, "b. Testing Set",  "1. Microaneurysms"),
        "he": os.path.join(MASKS_BASE, "b. Testing Set",  "2. Haemorrhages"),
        "ex": os.path.join(MASKS_BASE, "b. Testing Set",  "3. Hard Exudates"),
    }
}

def get_image_ids(img_dir):
    """Extract IDRiD image IDs from directory (e.g. IDRiD_01.jpg -> IDRiD_01)."""
    ids = []
    for f in sorted(os.listdir(img_dir)):
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".tif")):
            base = os.path.splitext(f)[0]
            ids.append(base)
    return ids

def load_mask(mask_dir, img_id, shape):
    """Load a binary mask for an image; return zeros if mask not found."""
    for ext in [".tif", ".jpg", ".png", ".bmp"]:
        # IDRiD masks use underscore suffixes like IDRiD_01_MA.tif
        candidate_patterns = [
            os.path.join(mask_dir, img_id + ext),
            os.path.join(mask_dir, img_id + "_MA" + ext),
            os.path.join(mask_dir, img_id + "_HE" + ext),
            os.path.join(mask_dir, img_id + "_EX" + ext),
            os.path.join(mask_dir, img_id + "_OD" + ext),
        ]
        for p in candidate_patterns:
            if os.path.exists(p):
                m = np.array(Image.open(p).convert("L").resize(
                    (shape[1], shape[0]), Image.NEAREST))
                return (m > 127).astype(np.uint8)
    # Search by prefix
    if os.path.exists(mask_dir):
        for f in os.listdir(mask_dir):
            if f.startswith(img_id):
                p = os.path.join(mask_dir, f)
                m = np.array(Image.open(p).convert("L").resize(
                    (shape[1], shape[0]), Image.NEAREST))
                return (m > 127).astype(np.uint8)
    return np.zeros((shape[0], shape[1]), dtype=np.uint8)

class IDRiDDataset(Dataset):
    def __init__(self, img_dir, mask_dirs, augment=True):
        self.img_dir   = img_dir
        self.mask_dirs = mask_dirs
        self.augment   = augment
        self.ids       = get_image_ids(img_dir)
        print(f"  [IDRiD] Loaded {len(self.ids)} images from {img_dir}")

    def __len__(self):
        return len(self.ids)

    def __getitem__(self, idx):
        img_id = self.ids[idx]

        # Find image file
        img_path = None
        for ext in [".jpg", ".jpeg", ".png", ".tif"]:
            p = os.path.join(self.img_dir, img_id + ext)
            if os.path.exists(p):
                img_path = p
                break

        img = Image.open(img_path).convert("RGB") if img_path else Image.new("RGB", (IMG_SIZE, IMG_SIZE))
        img = img.resize((IMG_SIZE, IMG_SIZE), Image.LANCZOS)
        img_np = np.array(img, dtype=np.float32) / 255.0

        # Build multi-class mask: 0=bg, 1=MA, 2=HE, 3=EX
        mask = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.int64)
        for cls_idx, key in enumerate(["ma", "he", "ex"], start=1):
            if key in self.mask_dirs:
                m = load_mask(self.mask_dirs[key], img_id, (IMG_SIZE, IMG_SIZE))
                mask[m > 0] = cls_idx

        # Random augmentation
        if self.augment:
            if np.random.rand() > 0.5:
                img_np = img_np[:, ::-1].copy()
                mask   = mask[:, ::-1].copy()
            if np.random.rand() > 0.5:
                img_np = img_np[::-1, :].copy()
                mask   = mask[::-1, :].copy()

        # Normalize
        mean = np.array([0.485, 0.456, 0.406])
        std  = np.array([0.229, 0.224, 0.225])
        img_np = (img_np - mean) / std
        img_t  = torch.from_numpy(img_np.transpose(2, 0, 1).astype(np.float32))
        mask_t = torch.from_numpy(mask)
        return img_t, mask_t

train_ds = IDRiDDataset(TRAIN_IMGS, MASK_DIRS["train"], augment=True)
test_ds  = IDRiDDataset(TEST_IMGS,  MASK_DIRS["test"],  augment=False)
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0, pin_memory=True)
test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

# ── U-Net Architecture ─────────────────────────────────────────────────────────
class DoubleConv(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.net(x)

class UNet(nn.Module):
    def __init__(self, in_channels=3, num_classes=NUM_CLASSES):
        super().__init__()
        # Encoder
        self.enc1 = DoubleConv(in_channels, 64)
        self.enc2 = DoubleConv(64, 128)
        self.enc3 = DoubleConv(128, 256)
        self.enc4 = DoubleConv(256, 512)
        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout2d(0.3)
        # Bottleneck
        self.bottleneck = DoubleConv(512, 1024)
        # Decoder
        self.up4   = nn.ConvTranspose2d(1024, 512, 2, stride=2)
        self.dec4  = DoubleConv(1024, 512)
        self.up3   = nn.ConvTranspose2d(512, 256, 2, stride=2)
        self.dec3  = DoubleConv(512, 256)
        self.up2   = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec2  = DoubleConv(256, 128)
        self.up1   = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec1  = DoubleConv(128, 64)
        self.head  = nn.Conv2d(64, num_classes, 1)

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.dropout(self.enc4(self.pool(e3)))
        b  = self.bottleneck(self.pool(e4))
        d4 = self.dec4(torch.cat([self.up4(b), e4], dim=1))
        d3 = self.dec3(torch.cat([self.up3(d4), e3], dim=1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        return self.head(d1)

model = UNet().to(DEVICE)
total_params = sum(p.numel() for p in model.parameters())
print(f"[model] U-Net params: {total_params/1e6:.2f}M")

# Class-weighted cross-entropy: foreground classes upweighted heavily
# IDRiD: lesions are tiny (<<1% of pixels), background dominates
class_weights = torch.tensor([0.1, 5.0, 3.0, 2.0], dtype=torch.float32).to(DEVICE)
criterion  = nn.CrossEntropyLoss(weight=class_weights)
optimizer  = torch.optim.Adam(model.parameters(), lr=LR)
scheduler  = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=8, factor=0.5)
use_amp    = DEVICE.type == "cuda"
scaler     = torch.amp.GradScaler("cuda") if use_amp else None

# ── Dice coefficient ───────────────────────────────────────────────────────────
def dice_score(pred, target, num_classes=NUM_CLASSES, eps=1e-6):
    pred_oh   = F.one_hot(pred.argmax(1), num_classes).permute(0,3,1,2).float()
    target_oh = F.one_hot(target, num_classes).permute(0,3,1,2).float()
    dice = []
    for c in range(1, num_classes):  # skip background
        inter = (pred_oh[:,c] * target_oh[:,c]).sum()
        union = pred_oh[:,c].sum() + target_oh[:,c].sum()
        dice.append((2 * inter + eps) / (union + eps))
    return float(sum(dice) / len(dice))

# ── Resume from checkpoint ────────────────────────────────────────────────────
start_epoch = 1
best_dice   = 0.0
best_state  = None
history_seg = []

if os.path.exists(CKPT_LATEST):
    print(f"[resume] Found checkpoint: {CKPT_LATEST}")
    ckpt = torch.load(CKPT_LATEST, map_location=DEVICE)
    model.load_state_dict(ckpt["model_state_dict"])
    optimizer.load_state_dict(ckpt["optimizer_state"])
    scheduler.load_state_dict(ckpt["scheduler_state"])
    if use_amp and "scaler_state" in ckpt and ckpt["scaler_state"]:
        scaler.load_state_dict(ckpt["scaler_state"])
    start_epoch  = ckpt["epoch"] + 1
    best_dice    = ckpt.get("best_dice", 0.0)
    best_state   = ckpt.get("best_state")
    history_seg  = ckpt.get("history", [])
    print(f"[resume] Resuming from epoch {start_epoch} | Best dice: {best_dice:.4f}")
else:
    print("[train] No checkpoint found — starting fresh.")

# ── Training loop ──────────────────────────────────────────────────────────────
print(f"\n[train] Epochs {start_epoch}->{EPOCHS} | Batch={BATCH_SIZE} | IMG={IMG_SIZE}x{IMG_SIZE}")
print("-" * 70)

for epoch in range(start_epoch, EPOCHS + 1):
    model.train()
    tl = 0.0
    t0 = time.time()
    for imgs, masks in train_loader:
        imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
        optimizer.zero_grad()
        if use_amp:
            with torch.amp.autocast("cuda"):
                out = model(imgs); loss = criterion(out, masks)
            scaler.scale(loss).backward()
            scaler.step(optimizer); scaler.update()
        else:
            out = model(imgs); loss = criterion(out, masks)
            loss.backward(); optimizer.step()
        tl += loss.item()

    model.eval()
    vl, vd = 0.0, []
    with torch.no_grad():
        for imgs, masks in test_loader:
            imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
            out = model(imgs)
            vl += criterion(out, masks).item()
            vd.append(dice_score(out, masks))

    avg_vl = vl / len(test_loader)
    avg_vd = float(np.mean(vd))
    scheduler.step(avg_vl)

    print(f"Ep {epoch:02d}/{EPOCHS} | "
          f"TrLoss={tl/len(train_loader):.4f} | "
          f"ValLoss={avg_vl:.4f} ValDice={avg_vd:.4f} | "
          f"{time.time()-t0:.0f}s")
    history_seg.append({"epoch": epoch, "val_dice": avg_vd, "val_loss": avg_vl})

    if avg_vd > best_dice:
        best_dice  = avg_vd
        best_state = copy.deepcopy(model.state_dict())
        print(f"  -> Best dice={best_dice:.4f}")

    # ── Checkpoint every N epochs ──────────────────────────────────────────────
    if epoch % CKPT_EVERY == 0 or avg_vd == best_dice or epoch == EPOCHS:
        ckpt_data = {
            "epoch":           epoch,
            "model_state_dict":model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "scheduler_state": scheduler.state_dict(),
            "scaler_state":    scaler.state_dict() if use_amp else None,
            "best_dice":       best_dice,
            "best_state":      best_state,
            "history":         history_seg,
        }
        torch.save(ckpt_data, os.path.join(CKPT_DIR, f"lesion_epoch_{epoch:02d}.pth"))
        torch.save(ckpt_data, CKPT_LATEST)
        print(f"  [ckpt] Saved epoch {epoch} checkpoint")

torch.save({"model_state_dict": best_state, "num_classes": NUM_CLASSES,
            "class_names": CLASS_NAMES, "img_size": IMG_SIZE,
            "best_dice": best_dice}, OUT_PTH)

report = {"model": "U-Net Lesion Segmentation", "dataset": "IDRiD",
          "train_images": len(train_ds), "test_images": len(test_ds),
          "classes": CLASS_NAMES, "best_val_dice": round(best_dice, 4),
          "img_size": IMG_SIZE}
with open(OUT_REPORT, "w") as f:
    json.dump(report, f, indent=2)

print(f"\n[done] Best Dice: {best_dice:.4f}")
print(f"[save] {OUT_PTH}")
print(f"[save] {OUT_REPORT}")
