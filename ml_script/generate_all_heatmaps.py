# generate_all_heatmaps.py
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torchvision.transforms as transforms
# pyrefly: ignore [missing-import]
from torchvision.models import resnet50, ResNet50_Weights
from PIL import Image
# pyrefly: ignore [missing-import]
import cv2
import numpy as np
# pyrefly: ignore [missing-import]
from pytorch_grad_cam import GradCAM
# pyrefly: ignore [missing-import]
from pytorch_grad_cam.utils.image import show_cam_on_image
# pyrefly: ignore [missing-import]
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
import os
import glob

print("=" * 60)
print("🚀 STARTING HEATMAP GENERATOR")
print("=" * 60)

# Folders
input_folder = "input_images"
output_folder = "output_heatmaps"

# Check if input folder exists
if not os.path.exists(input_folder):
    print(f"❌ ERROR: Input folder '{input_folder}' not found!")
    print(f"   Please create it and put your images there.")
    print(f"   Expected naming: level_0_od.jpg, level_0_os.jpg, ... level_4_os.jpg")
    exit(1)

# Find images
image_files = glob.glob(os.path.join(input_folder, "*.jpg")) + glob.glob(os.path.join(input_folder, "*.png"))
print(f"📁 Found {len(image_files)} images in '{input_folder}/'")

if len(image_files) == 0:
    print("❌ No images found! Please put your images in input_images/")
    exit(1)

# Create output folder
os.makedirs(output_folder, exist_ok=True)
print(f"✅ Output folder ready: '{output_folder}/'")

# Load model
print("🚀 Loading ResNet50... (this takes 30 seconds the first time)")
try:
    model = resnet50(weights=ResNet50_Weights.DEFAULT)
    model.eval()
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    exit(1)

# Preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def generate_heatmap(input_path, output_path):
    try:
        img = Image.open(input_path).convert('RGB')
        original_img = cv2.imread(input_path)
        if original_img is None:
            return False
        
        original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        original_img_resized = cv2.resize(original_img, (224, 224)) / 255.0
        input_tensor = transform(img).unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_tensor)
            predicted_class = output[0].argmax().item()
        
        target_layers = [model.layer4[-1]]
        cam = GradCAM(model=model, target_layers=target_layers)
        targets = [ClassifierOutputTarget(predicted_class)]
        
        grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
        grayscale_cam = grayscale_cam[0, :]
        visualization = show_cam_on_image(original_img_resized, grayscale_cam, use_rgb=True)
        
        cv2.imwrite(output_path, cv2.cvtColor(visualization, cv2.COLOR_RGB2BGR))
        print(f"   ✅ Generated: {os.path.basename(output_path)}")
        return True
    except Exception as e:
        print(f"   ❌ Error on {input_path}: {e}")
        return False

# Process images
print("\n🔄 Generating heatmaps...")
success_count = 0
fail_count = 0

for img_path in image_files:
    filename = os.path.basename(img_path)
    name_without_ext = os.path.splitext(filename)[0]
    
    if name_without_ext.startswith("level_"):
        parts = name_without_ext.split("_")
        if len(parts) >= 3:
            level = parts[1]
            eye = parts[2]
            output_filename = f"heatmap_{level}_{eye}.jpg"
            output_path = os.path.join(output_folder, output_filename)
            
            if generate_heatmap(img_path, output_path):
                success_count += 1
            else:
                fail_count += 1

# Summary
print("\n" + "=" * 60)
print("📊 SUMMARY")
print("=" * 60)
print(f"✅ Successfully generated: {success_count} heatmaps")
print(f"❌ Failed: {fail_count}")
print(f"📁 Output folder: {os.path.abspath(output_folder)}")

if success_count > 0:
    print("\n🎯 NEXT STEPS:")
    print("1. Copy heatmaps to frontend:")
    print(f"   copy {output_folder}\\*.jpg ..\\Frontend\\retinascan-app\\public\\images\\")
    print("\n2. Copy original images and rename them:")
    print("   level_0_od.jpg -> img_0_od.jpg")
    print("   level_0_os.jpg -> img_0_os.jpg")
    print("   ... and so on")
print("=" * 60)