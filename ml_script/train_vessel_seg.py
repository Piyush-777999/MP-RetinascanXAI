# ml_script/train_vessel_seg.py
# U-Net Blood Vessel Segmentation — DRIVE Dataset
# 20 training images with pixel-level vessel mask annotation
# Checkpoint resume: re-run after a crash to continue from last checkpoint
# Outputs: ml_script/vessel_unet.pth  |  ml_script/checkpoints/vessel_latest.pth
#
# Run from repo root:
#   ml_script/train_env/Scripts/python.exe ml_script/train_vessel_seg.py

import os, json, time, copy
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

# ── Paths ──────────────────────────────────────────────────────────────────────
REPO       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRIVE_BASE = r"D:\AntiGravity projects\MP-RetinascanXAI\dataset\Drive\extracted"
TRAIN_IMGS = os.path.join(DRIVE_BASE, "training", "images")
TRAIN_MASKS= os.path.join(DRIVE_BASE, "training", "1st_manual")
TRAIN_FOV  = os.path.join(DRIVE_BASE, "training", "mask")
TEST_IMGS  = os.path.join(DRIVE_BASE, "test", "images")
TEST_FOV   = os.path.join(DRIVE_BASE, "test", "mask")
CKPT_DIR   = os.path.join(REPO, "ml_script", "checkpoints")
CKPT_LATEST= os.path.join(CKPT_DIR, "vessel_latest.pth")
OUT_PTH    = os.path.join(REPO, "ml_script", "vessel_unet.pth")
OUT_REPORT = os.path.join(REPO, "ml_script", "vessel_seg_report.json")
os.makedirs(CKPT_DIR, exist_ok=True)

# ── Config ─────────────────────────────────────────────────────────────────────
PATCH_SIZE  = 64     # DRIVE has only 20 images; use patch-based training
PATCHES_PER = 40     # patches extracted per image per epoch
BATCH_SIZE  = 32
EPOCHS      = 150    # more epochs for tiny dataset
LR          = 1e-3
SEED        = 42
CKPT_EVERY  = 25    # save checkpoint every N epochs

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"[init] Device: {DEVICE}")
if DEVICE.type == "cuda":
    print(f"[init] GPU: {torch.cuda.get_device_name(0)}")

torch.manual_seed(SEED)
np.random.seed(SEED)

# ── Preprocessing ──────────────────────────────────────────────────────────────
def clahe_green(img_pil):
    """Extract green channel CLAHE — vessels most visible in green."""
    import cv2
    img = np.array(img_pil.convert("RGB"))
    green = img[:, :, 1]
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    green = clahe.apply(green)
    # Gamma correction
    green = np.clip(((green / 255.0) ** (1.0 / 1.2)) * 255.0, 0, 255).astype(np.uint8)
    return green

# ── Dataset ────────────────────────────────────────────────────────────────────
class DRIVEDataset(Dataset):
    def __init__(self, img_dir, mask_dir, fov_dir, patches_per=PATCHES_PER, augment=True):
        self.img_dir     = img_dir
        self.mask_dir    = mask_dir
        self.fov_dir     = fov_dir
        self.patches_per = patches_per
        self.augment     = augment
        self.img_files   = sorted(f for f in os.listdir(img_dir)
                                  if f.lower().endswith((".tif", ".jpg", ".png")))
        print(f"  [DRIVE] {len(self.img_files)} images in {img_dir}")
        self._preload()

    def _preload(self):
        """Preload all images + masks into RAM (only 20 images, ~200MB)."""
        self.images = []
        self.masks  = []
        self.fovs   = []
        for fname in self.img_files:
            img  = Image.open(os.path.join(self.img_dir, fname)).convert("RGB")
            g    = clahe_green(img)
            self.images.append(g.astype(np.float32) / 255.0)

            if self.mask_dir and os.path.exists(self.mask_dir):
                # DRIVE: 21_manual1.gif -> image 21_training.tif
                stem  = fname.split("_")[0]
                mfile = None
                for mf in os.listdir(self.mask_dir):
                    if mf.startswith(stem):
                        mfile = mf
                        break
                if mfile:
                    m = Image.open(os.path.join(self.mask_dir, mfile)).convert("L")
                    self.masks.append((np.array(m) > 127).astype(np.float32))
                else:
                    self.masks.append(np.zeros_like(self.images[-1]))
            else:
                self.masks.append(None)

            if self.fov_dir and os.path.exists(self.fov_dir):
                stem  = fname.split("_")[0]
                ffile = None
                for ff in os.listdir(self.fov_dir):
                    if ff.startswith(stem):
                        ffile = ff
                        break
                if ffile:
                    fov = Image.open(os.path.join(self.fov_dir, ffile)).convert("L")
                    self.fovs.append((np.array(fov) > 127))
                else:
                    self.fovs.append(np.ones_like(self.images[-1], dtype=bool))
            else:
                self.fovs.append(np.ones_like(self.images[-1], dtype=bool))

        print(f"  [DRIVE] Preloaded all images. Mask available: {self.masks[0] is not None}")

    def __len__(self):
        return len(self.img_files) * self.patches_per

    def __getitem__(self, idx):
        img_idx   = idx % len(self.img_files)
        img       = self.images[img_idx]
        mask      = self.masks[img_idx]
        fov       = self.fovs[img_idx]
        H, W      = img.shape

        # Random patch from inside FOV
        for _ in range(50):
            r = np.random.randint(0, H - PATCH_SIZE)
            c = np.random.randint(0, W - PATCH_SIZE)
            fov_patch = fov[r:r+PATCH_SIZE, c:c+PATCH_SIZE]
            if fov_patch.mean() > 0.7:
                break

        img_patch  = img[r:r+PATCH_SIZE, c:c+PATCH_SIZE]
        if mask is not None:
            mask_patch = mask[r:r+PATCH_SIZE, c:c+PATCH_SIZE]
        else:
            mask_patch = np.zeros((PATCH_SIZE, PATCH_SIZE), dtype=np.float32)

        # Augmentation
        if self.augment:
            k = np.random.randint(4)
            img_patch  = np.rot90(img_patch, k).copy()
            mask_patch = np.rot90(mask_patch, k).copy()
            if np.random.rand() > 0.5:
                img_patch  = np.fliplr(img_patch).copy()
                mask_patch = np.fliplr(mask_patch).copy()

        # Standardize
        img_patch  = (img_patch - img_patch.mean()) / (img_patch.std() + 1e-8)
        img_t  = torch.from_numpy(img_patch).unsqueeze(0).float()   # [1, P, P]
        mask_t = torch.from_numpy(mask_patch).long()                 # [P, P]
        return img_t, mask_t

train_ds = DRIVEDataset(TRAIN_IMGS, TRAIN_MASKS, TRAIN_FOV, augment=True)
test_ds  = DRIVEDataset(TEST_IMGS,  None,         TEST_FOV,  patches_per=20, augment=False)
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=0, pin_memory=True)
test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

# ── Lightweight U-Net (1-channel input for grayscale green channel) ──────────
class ConvBlock(nn.Module):
    def __init__(self, in_c, out_c):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_c, out_c, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
            nn.Conv2d(out_c, out_c, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_c), nn.ReLU(inplace=True),
        )
    def forward(self, x): return self.net(x)

class VesselUNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.pool = nn.MaxPool2d(2)
        self.enc1 = ConvBlock(1, 32)
        self.enc2 = ConvBlock(32, 64)
        self.enc3 = ConvBlock(64, 128)
        self.bot  = ConvBlock(128, 256)
        self.up3  = nn.ConvTranspose2d(256, 128, 2, stride=2)
        self.dec3 = ConvBlock(256, 128)
        self.up2  = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec2 = ConvBlock(128, 64)
        self.up1  = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.dec1 = ConvBlock(64, 32)
        self.head = nn.Conv2d(32, 2, 1)  # binary: vessel / background

    def forward(self, x):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        b  = self.bot(self.pool(e3))
        d3 = self.dec3(torch.cat([self.up3(b), e3], 1))
        d2 = self.dec2(torch.cat([self.up2(d3), e2], 1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], 1))
        return self.head(d1)

model = VesselUNet().to(DEVICE)
print(f"[model] VesselUNet params: {sum(p.numel() for p in model.parameters())/1e6:.2f}M")

# Vessel pixels ~10-20% of FOV, background 80-90%
class_weights = torch.tensor([0.3, 0.7], dtype=torch.float32).to(DEVICE)
criterion  = nn.CrossEntropyLoss(weight=class_weights)
optimizer  = torch.optim.Adam(model.parameters(), lr=LR)
scheduler  = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)
use_amp    = DEVICE.type == "cuda"
scaler     = torch.amp.GradScaler("cuda") if use_amp else None

def dice_score_binary(pred_logits, target, eps=1e-6):
    pred = pred_logits.argmax(1).float()
    tgt  = target.float()
    inter = (pred * tgt).sum()
    return float((2 * inter + eps) / (pred.sum() + tgt.sum() + eps))

# ── Resume from checkpoint ────────────────────────────────────────────────────
start_epoch = 1
best_dice   = 0.0
best_state  = None
history_v   = []

if os.path.exists(CKPT_LATEST):
    print(f"[resume] Found checkpoint: {CKPT_LATEST}")
    ckpt = torch.load(CKPT_LATEST, map_location=DEVICE)
    model.load_state_dict(ckpt["model_state_dict"])
    optimizer.load_state_dict(ckpt["optimizer_state"])
    scheduler.load_state_dict(ckpt["scheduler_state"])
    if use_amp and "scaler_state" in ckpt and ckpt["scaler_state"]:
        scaler.load_state_dict(ckpt["scaler_state"])
    start_epoch = ckpt["epoch"] + 1
    best_dice   = ckpt.get("best_dice", 0.0)
    best_state  = ckpt.get("best_state")
    history_v   = ckpt.get("history", [])
    print(f"[resume] Resuming from epoch {start_epoch} | Best dice: {best_dice:.4f}")
else:
    print("[train] No checkpoint found — starting fresh.")

# ── Training ───────────────────────────────────────────────────────────────────
print(f"\n[train] Epochs {start_epoch}->{EPOCHS} | Patch={PATCH_SIZE}x{PATCH_SIZE} | Batch={BATCH_SIZE}")
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
    scheduler.step()

    if epoch % 10 == 0 or epoch <= 5:
        model.eval()
        vd = []
        with torch.no_grad():
            for imgs, masks in test_loader:
                imgs, masks = imgs.to(DEVICE), masks.to(DEVICE)
                vd.append(dice_score_binary(model(imgs), masks))
        avg_dice = float(np.mean(vd))
        print(f"Ep {epoch:03d}/{EPOCHS} | TrLoss={tl/len(train_loader):.4f} | "
              f"Dice={avg_dice:.4f} | {time.time()-t0:.0f}s")
        history_v.append({"epoch": epoch, "dice": avg_dice})
        if avg_dice > best_dice:
            best_dice  = avg_dice
            best_state = copy.deepcopy(model.state_dict())
            print(f"  -> Best dice={best_dice:.4f}")
    else:
        print(f"Ep {epoch:03d}/{EPOCHS} | TrLoss={tl/len(train_loader):.4f} | {time.time()-t0:.0f}s")

    # ── Checkpoint ────────────────────────────────────────────────────────
    if epoch % CKPT_EVERY == 0 or epoch == EPOCHS:
        ckpt_data = {
            "epoch":           epoch,
            "model_state_dict":model.state_dict(),
            "optimizer_state": optimizer.state_dict(),
            "scheduler_state": scheduler.state_dict(),
            "scaler_state":    scaler.state_dict() if use_amp else None,
            "best_dice":       best_dice,
            "best_state":      best_state,
            "history":         history_v,
        }
        torch.save(ckpt_data, os.path.join(CKPT_DIR, f"vessel_epoch_{epoch:03d}.pth"))
        torch.save(ckpt_data, CKPT_LATEST)
        print(f"  [ckpt] Saved epoch {epoch} checkpoint")

torch.save({"model_state_dict": best_state, "patch_size": PATCH_SIZE,
            "best_dice": best_dice}, OUT_PTH)

report = {"model": "VesselUNet", "dataset": "DRIVE",
          "train_images": len(train_ds.img_files),
          "test_images":  len(test_ds.img_files),
          "patch_size": PATCH_SIZE, "best_dice": round(best_dice, 4)}
with open(OUT_REPORT, "w") as f:
    json.dump(report, f, indent=2)

print(f"\n[done] Best Dice: {best_dice:.4f}")
print(f"[save] {OUT_PTH}")
