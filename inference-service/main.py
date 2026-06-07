from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import onnxruntime as ort
import numpy as np
from PIL import Image
import io
import os

app = FastAPI(title="Tomato Leaf ML Inference Service")

# Allow Gateway to communicate with this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Gateway's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ONNX model
# We use the parent directory since the model is currently in the root workspace
MODEL_PATH = os.environ.get("MODEL_PATH", "tomato_cnn_model.onnx")
try:
    session = ort.InferenceSession(MODEL_PATH)
    input_name = session.get_inputs()[0].name
    print(f"✅ ONNX Model loaded successfully. Input node: {input_name}")
except Exception as e:
    print(f"❌ Failed to load ONNX model: {e}")
    session = None

# Class labels matching the exact alphabetical order of the dataset folders
CLASS_NAMES = [
    'Tomato_Bacterial_spot', 
    'Tomato_Early_blight', 
    'Tomato_Late_blight', 
    'Tomato_Leaf_Mold', 
    'Tomato_Septoria_leaf_spot', 
    'Tomato_Spider_mites_Two_spotted_spider_mite', 
    'Tomato__Target_Spot', 
    'Tomato__Tomato_YellowLeaf__Curl_Virus', 
    'Tomato__Tomato_mosaic_virus', 
    'Tomato_healthy', 
    'Tomato_powdery_mildew'
]

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocesses the image bytes to match MobileNetV2 input requirements."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image = image.resize((224, 224))
        img_array = np.array(image) / 255.0 # Normalize pixel values to [0, 1]
        img_batch = np.expand_dims(img_array, axis=0).astype(np.float32) # Shape: (1, 224, 224, 3)
        return img_batch
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")

@app.post("/predict")
async def predict_disease(images: List[UploadFile] = File(...)):
    if session is None:
        raise HTTPException(status_code=500, detail="ONNX model is not loaded.")
        
    for file in images:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="All uploaded files must be images.")

    try:
        # Preprocess all images
        input_tensors = []
        filenames = []
        for file in images:
            contents = await file.read()
            tensor = preprocess_image(contents) # Shape: (1, 224, 224, 3)
            input_tensors.append(tensor[0]) # Remove the first dim so we can stack them
            filenames.append(file.filename)
            
        # Stack all tensors into a single batch: (N, 224, 224, 3)
        batch_tensor = np.stack(input_tensors).astype(np.float32)
        
        # Run ONNX inference
        batch_predictions = session.run(None, {input_name: batch_tensor})[0]
        
        results = []
        for i, predictions in enumerate(batch_predictions):
            # Extract results for this specific image in the batch
            predicted_class_index = int(np.argmax(predictions))
            confidence_score = float(np.max(predictions)) * 100
            predicted_disease = CLASS_NAMES[predicted_class_index]
            
            # Format the disease name for the frontend
            formatted_disease = predicted_disease.replace('_', ' ').replace('Tomato ', '').strip()
            if "healthy" in formatted_disease.lower():
                status = "Healthy"
            else:
                status = "Diseased"

            results.append({
                "filename": filenames[i],
                "disease_name": formatted_disease,
                "raw_class": predicted_disease,
                "confidence": round(confidence_score, 2),
                "status": status
            })

        return results
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.get("/health")
def health_check():
    return {"status": "ML Inference Service is running", "model_loaded": session is not None}

if __name__ == "__main__":
    # Start the service on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
