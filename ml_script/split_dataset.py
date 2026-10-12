"""
ml_script/split_dataset.py
===========================
ONE-TIME script to freeze the train/val split.

Run this ONCE.  Never run again.
Outputs:
    ml_script/train_ids.csv   — id_code + diagnosis for training images
    ml_script/val_ids.csv     — id_code + diagnosis for validation images

These CSVs are committed to Git and used by train_model.py and
evaluate_model.py instead of re-splitting at runtime.  This prevents
data leakage if the CSV row order ever changes.

USAGE:
    python split_dataset.py
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split

# ── Config (must match train_model.py) ─────────────────────────────────────
DATASET_ROOT = os.environ.get("DATASET_ROOT", r"dataset\aptos2019-blindness-detection")
TRAIN_CSV    = os.path.join(DATASET_ROOT, "train.csv")
OUTPUT_DIR   = os.path.dirname(os.path.abspath(__file__))

VAL_SPLIT   = 0.20
RANDOM_SEED = 42


def main():
    print("RetinaScan-XAI — Freezing train/val split")
    print(f"Source CSV : {TRAIN_CSV}")

    df = pd.read_csv(TRAIN_CSV)
    print(f"Total samples: {len(df)}")
    print(f"Class distribution:\n{df['diagnosis'].value_counts().sort_index().to_string()}")

    train_df, val_df = train_test_split(
        df,
        test_size=VAL_SPLIT,
        random_state=RANDOM_SEED,
        stratify=df["diagnosis"],
    )

    train_out = os.path.join(OUTPUT_DIR, "train_ids.csv")
    val_out   = os.path.join(OUTPUT_DIR, "val_ids.csv")

    train_df.to_csv(train_out, index=False)
    val_df.to_csv(val_out,   index=False)

    print(f"\nSaved {len(train_df)} training IDs  -> {train_out}")
    print(f"Saved {len(val_df)}   validation IDs -> {val_out}")
    print("\nDONE. Commit train_ids.csv and val_ids.csv to Git. DO NOT run this again.")


if __name__ == "__main__":
    main()
