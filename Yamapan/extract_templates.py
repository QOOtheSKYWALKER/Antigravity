import cv2
import numpy as np
import base64
import os

img_path = 'test_sticker.jpg'
img = cv2.imread(img_path)

if img is None:
    print("Cannot read image.")
    exit()

# BGR to HSV for red color detection
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
lower_red1 = np.array([0, 100, 100])
upper_red1 = np.array([10, 255, 255])
mask1 = cv2.inRange(hsv, lower_red1, upper_red1)

lower_red2 = np.array([160, 100, 100])
upper_red2 = np.array([180, 255, 255])
mask2 = cv2.inRange(hsv, lower_red2, upper_red2)

mask = mask1 + mask2

# Find contours
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

os.makedirs('tmp_templates', exist_ok=True)
count = 0

for c in contours:
    # Filter circular contours
    area = cv2.contourArea(c)
    if area > 1000:
        x, y, w, h = cv2.boundingRect(c)
        aspect_ratio = float(w) / h
        if 0.8 <= aspect_ratio <= 1.2:
            # Expand bounding box slightly
            padding = int(w * 0.1)
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(img.shape[1] - x, w + 2*padding)
            h = min(img.shape[0] - y, h + 2*padding)
            
            roi = img[y:y+h, x:x+w]
            cv2.imwrite(f'tmp_templates/circle_{count}.jpg', roi)
            count += 1

print(f"Extracted {count} circles.")
