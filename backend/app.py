import os
import json
import base64
import time
import cv2
import io
import matplotlib
# Use Agg backend for matplotlib to prevent GUI thread crashing in Flask
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    try:
        import tensorflow.lite as tflite
    except ImportError:
        tflite = None

app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True
)
@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response
history_db = []

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Ensure the backend strictly loads the user's defined .h5 model file
MODEL_PATH = os.path.join(BASE_DIR, 'skin_model.tflite')

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

interpreter = None
if tflite is not None:
    try:
        interpreter = tflite.Interpreter(model_path=MODEL_PATH)
        interpreter.allocate_tensors()
        print(f"Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print("Error: TFLite interpreter not available.")

classes = [
    'Acne', 'Eczema', 'Lichen', 'Moles',
    'Psoriasis', 'Skin Cancer', 'Vitiligo', 'Warts',
    'Fungal Infection', 'Skin Allergy'
]

def predict_image(img_path):
    if interpreter is None:
        raise ValueError("Model interpreter is not loaded")
        
    img = cv2.imread(img_path)
    if img is None:
        raise ValueError(f"Could not read image: {img_path}")
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img_resized = cv2.resize(img_rgb, (256, 256))
    img_array = np.expand_dims(img_resized, axis=0).astype(np.float32) / 255.0

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()

    prediction = interpreter.get_tensor(output_details[0]['index'])
    confidence = float(np.max(prediction)) * 100
    class_index = int(np.argmax(prediction))

    return classes[class_index], round(confidence, 2)

@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "message": "Skin Disease ROI Detection API is running. Please access the React frontend UI."
    })

def plot_histogram_to_base64(img, is_gray=False):
    plt.figure(figsize=(6, 4))
    if is_gray:
        hist = cv2.calcHist([img], [0], None, [256], [0, 256])
        plt.plot(hist, color='black', linewidth=2)
        plt.xlim([0, 256])
    else:
        colors = ('b', 'g', 'r')
        for i, col in enumerate(colors):
            hist = cv2.calcHist([img], [i], None, [256], [0, 256])
            plt.plot(hist, color=col, linewidth=2)
            plt.xlim([0, 256])
            
    plt.title('Pixel Intensity Distribution')
    plt.xlabel('Color Value (0-255)')
    plt.ylabel('Pixel Density')
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=100)
    plt.close()
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode('utf-8')
    return f"data:image/png;base64,{encoded}"

def cv2_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    encoded_string = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{encoded_string}"

def enhance_image(img):
    """
    1. IMAGE ENHANCEMENT:
    * Convert image to LAB color space
    * Apply CLAHE on L-channel for contrast improvement
    * Normalize brightness and reduce lighting variations
    * Apply mild sharpening for better texture visibility
    """
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    lab[:,:,0] = clahe.apply(lab[:,:,0])
    
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    kernel = np.array([[0, -0.5, 0], [-0.5, 3, -0.5], [0, -0.5, 0]])
    enhanced = cv2.filter2D(enhanced, -1, kernel)
    return enhanced

def segment_lesion(enhanced):
    """
    2. SPATIAL SEGMENTATION (GrabCut Algorithm)
    Utilize OpenCV GrabCut to iteratively model the foreground (lesion) 
    vs background using spatial margin constraints.
    """
    h, w = enhanced.shape[:2]
    
    # Initialize mask and background/foreground models for GrabCut
    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    # Define bounding box: assumption that lesion is not touching the outer 5-10% margins
    margin_x = int(w * 0.05)
    margin_y = int(h * 0.05)
    rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)
    
    # Run GrabCut algorithm with 5 iterations
    cv2.grabCut(enhanced, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    
    # The mask contains values:
    # 0 = Definitely Background
    # 1 = Definitely Foreground
    # 2 = Probably Background
    # 3 = Probably Foreground
    # We want to extract 1 and 3 as the lesion mask
    binary_mask = np.where((mask == 1) | (mask == 3), 1, 0).astype('uint8') * 255
    
    # 3. FAIL-SAFE SYSTEM
    # If GrabCut failed to find anything or flagged too much as foreground (e.g., > 80% area)
    total_pixels = h * w
    area_ratio = np.count_nonzero(binary_mask) / total_pixels
    
    if area_ratio == 0 or area_ratio > 0.8:
        # Fallback to pure Otsu Thresholding on the Red-Green (A) channel of LAB space
        lab = cv2.cvtColor(enhanced, cv2.COLOR_BGR2LAB)
        _, thresh_a = cv2.threshold(lab[:, :, 1], 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Mask out outer edges to discourage border artifacts
        center_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.rectangle(center_mask, (margin_x * 2, margin_y * 2), (w - margin_x * 2, h - margin_y * 2), 255, -1)
        fallback = cv2.bitwise_and(thresh_a, center_mask)
        return fallback

    return binary_mask

def refine_mask(mask):
    """
    4. MASK REFINEMENT
    Apply morphological operations, ensure mask is continuous, apply Gaussian blur.
    """
    kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    
    # Closing (fill gaps)
    refined = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel_large, iterations=2)
    # Opening (remove noise)
    refined = cv2.morphologyEx(refined, cv2.MORPH_OPEN, kernel_small, iterations=2)
    
    contours, _ = cv2.findContours(refined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = mask.shape
    total_area = h * w
    
    cleaned = np.zeros_like(mask)
    lesion_area = 0.0
    main_contour = None
    
    valid_contours = []
    for c in contours:
        area = cv2.contourArea(c)
        if 50 < area < total_area * 0.95:
            valid_contours.append(c)
            
    if valid_contours:
        valid_contours = sorted(valid_contours, key=cv2.contourArea, reverse=True)
        main_contour = valid_contours[0]
        lesion_area = cv2.contourArea(main_contour)
        cv2.drawContours(cleaned, [main_contour], -1, 255, thickness=-1)
        
    # Gaussian blur to smooth edges
    cleaned = cv2.GaussianBlur(cleaned, (11, 11), 0)
    _, cleaned = cv2.threshold(cleaned, 127, 255, cv2.THRESH_BINARY)
    
    return cleaned, lesion_area, main_contour

def create_overlay(image, mask, contour):
    """
    6. PERFECT OVERLAY
    Create colored mask, apply alpha blending, exact alignment.
    """
    overlay = image.copy()
    
    color_layer = np.zeros_like(image, dtype=np.uint8)
    color_layer[:] = (0, 0, 255) 
    
    mask_bool = mask.astype(bool)
    
    alpha = 0.5
    blended = cv2.addWeighted(overlay, 1 - alpha, color_layer, alpha, 0)
    
    overlay[mask_bool] = blended[mask_bool]
    
    if contour is not None:
        cv2.drawContours(overlay, [contour], -1, (0, 255, 255), 2)
        
    return overlay

@app.route('/process-image', methods=['POST'])
def process_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_bytes = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if img is None:
        return jsonify({"error": "Failed to decode image"}), 400

    # Ensure standardization for CV2 processing
    resized = cv2.resize(img, (256, 256))
    total_area = 256 * 256
    
    # 8. MODULAR PIPELINE EXECUTION
    enhanced = enhance_image(resized)
    raw_mask = segment_lesion(enhanced)
    final_mask, lesion_area, main_contour = refine_mask(raw_mask)
    overlay = create_overlay(resized, final_mask, main_contour)

    # 7. OUTPUT RESPONSE
    area_ratio = (lesion_area / total_area) * 100 if total_area > 0 else 0
    if lesion_area == 0:
        severity = 'Undetected'
    elif area_ratio < 3:
        severity = 'Mild'
    elif area_ratio < 10:
        severity = 'Moderate'
    else:
        severity = 'Severe'

    response_payload = {
        "severity": severity,
        "lesionArea": round(lesion_area, 2),
        "imageArea": total_area,
        "areaRatio": round(area_ratio, 2),
        "pipeline": [
            {"name": "Original Image", "image": cv2_to_base64(resized)},
            {"name": "Enhanced Image", "image": cv2_to_base64(enhanced)},
            {"name": "Segmented Mask", "image": cv2_to_base64(final_mask)},
            {"name": "Overlay Image", "image": cv2_to_base64(overlay)}
        ]
    }

    return jsonify(response_payload)


@app.route('/predict', methods=['POST'])
def predict():
    filepath = None
    
    if request.is_json and 'image' in request.json:
        b64_str = request.json['image']
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
            
        img_bytes = base64.b64decode(b64_str)
        filepath = os.path.join(UPLOAD_FOLDER, f"temp_{int(time.time())}.jpg")
        with open(filepath, "wb") as f:
            f.write(img_bytes)

    elif 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
    else:
        return jsonify({"error": "No file or image data in request"}), 400

    try:
        result, confidence = predict_image(filepath)
        
        with open(filepath, "rb") as img_file:
            encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
            img_data_uri = f"data:image/jpeg;base64,{encoded_string}"
        
        record = {
            "id": len(history_db) + 1,
            "disease": result,
            "confidence": confidence,
            "image": img_data_uri,
            "date": datetime.now().strftime("%B %d, %Y %I:%M %p")
        }
        history_db.append(record)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            
        return jsonify({
            "disease": result,
            "confidence": confidence,
            "image": img_data_uri
        })
        
    except Exception as e:
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
def history():
    return jsonify(history_db[::-1])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
