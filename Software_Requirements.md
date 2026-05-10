# Software Requirements

This section outlines the software tools, frameworks, and libraries used in the development of the Tomato Leaf Disease Detection, Classification, and Diagnosis System.

## 3.X.1 Programming Languages

| Language | Version | Usage |
|----------|---------|-------|
| Python | 3.12 | Machine learning model training, data preprocessing, and backend inference service development |
| TypeScript | 5.x | API gateway development (NestJS) and frontend application development (Next.js) |
| HTML/CSS | 5 / 3 | Frontend markup and styling via Tailwind CSS utility classes |

## 3.X.2 Machine Learning and Data Science Libraries

| Software | Version | Purpose |
|----------|---------|---------|
| TensorFlow | 2.21.0 | Core deep learning framework used for building, training, and saving the Convolutional Neural Network (CNN) |
| Keras | 3.14.0 | High-level API layered on top of TensorFlow, used for defining the MobileNetV2 architecture, adding custom classification layers, and compiling the model |
| MobileNetV2 | (via TensorFlow) | Pre-trained convolutional base model used for Transfer Learning; provides robust feature extraction capabilities trained on the ImageNet dataset |
| Scikit-Learn | 1.8.0 | Used for generating the Classification Report (Precision, Recall, F1-Score) and Confusion Matrix to evaluate model performance |
| NumPy | 2.4.4 | Fundamental library for numerical computation; used for array manipulation during image preprocessing and prediction output parsing |
| Matplotlib | 3.10.9 | Visualization library used for plotting training accuracy and loss curves across epochs |
| Seaborn | 0.13.2 | Statistical data visualization library used for rendering the Confusion Matrix as an annotated heatmap |
| Pillow (PIL) | 12.2.0 | Python Imaging Library used for loading, resizing, and converting uploaded leaf images to the required 224x224 RGB format |
| ONNX Runtime | 1.26.0 | High-performance inference engine used in the local backend to execute the trained model in the optimized Open Neural Network Exchange (ONNX) format |
| tf2onnx | (Latest) | Conversion tool used to transform the trained Keras/TensorFlow .h5 model into the portable .onnx format for local deployment |

## 3.X.3 Backend Frameworks and Servers

| Software | Version | Purpose |
|----------|---------|---------|
| FastAPI | 0.136.1 | Modern, high-performance Python web framework used to build the ML Inference Service REST API that accepts image uploads and returns disease predictions |
| Uvicorn | 0.46.0 | Lightning-fast ASGI (Asynchronous Server Gateway Interface) server used to host and run the FastAPI inference service |
| NestJS | 11.x | Progressive Node.js framework used to build the API Gateway, which acts as the central routing layer between the frontend client and the Python ML backend |
| Node.js | 22.20.0 | JavaScript runtime environment powering both the NestJS API Gateway and the Next.js frontend development server |

## 3.X.4 Frontend Frameworks and Libraries

| Software | Version | Purpose |
|----------|---------|---------|
| Next.js | 16.2.6 | React-based framework providing server-side rendering (SSR), file-based routing, and optimized production builds for the diagnostic web interface |
| React | 19.x | Component-based JavaScript UI library used for building the interactive diagnostic interface, including the image upload zone, camera module, and results display |
| Tailwind CSS | 4.x | Utility-first CSS framework used for rapid, responsive, and visually premium UI styling without writing custom CSS files |

## 3.X.5 Development and Cloud Environment

| Software | Purpose |
|----------|---------|
| Visual Studio Code (VS Code) | Primary Integrated Development Environment (IDE) used for writing, debugging, and managing the entire codebase across all three microservices |
| Google Colab / Kaggle Notebooks | Cloud-based Jupyter notebook environments providing free GPU (NVIDIA Tesla T4) resources for training the CNN model on the PlantVillage dataset |
| Git | Distributed version control system used for tracking code changes across the project lifecycle |
| npm (Node Package Manager) | Package manager used for installing and managing JavaScript/TypeScript dependencies in the NestJS and Next.js projects |
| pip | Python package manager used for installing and managing all Python dependencies within the virtual environment |

## 3.X.6 Hardware Requirements (Minimum)

| Component | Specification |
|-----------|--------------|
| Processor | Intel Core i5 / AMD Ryzen 5 (or equivalent) |
| RAM | 8 GB minimum (16 GB recommended) |
| Storage | 5 GB free disk space for project files, dependencies, and model |
| GPU (Training) | NVIDIA Tesla T4 (provided free via Kaggle/Colab cloud) |
| GPU (Inference) | Not required; ONNX Runtime runs efficiently on CPU |
| Internet | Required for initial setup, dependency installation, and cloud-based model training |
| Operating System | Windows 10/11, macOS, or Linux |
