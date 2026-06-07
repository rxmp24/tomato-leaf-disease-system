"use client";

import React, { useState, useRef, useCallback } from "react";

type ImageState = {
  id: string;
  file: File;
  preview: string;
  result?: { disease_name: string; confidence: number; status: string; raw_class: string } | null;
  error?: string | null;
};

export default function Home() {
  const [images, setImages] = useState<ImageState[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addFiles = (selectedFiles: File[]) => {
    const newImages = selectedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      result: null,
      error: null,
    }));
    setImages((prev) => [...prev, ...newImages]);
    setGlobalError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait a tiny bit for the browser to register the srcObject
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(e => {
              alert(`Video play failed: ${e.name} - ${e.message}. Tracks: ${mediaStream.getVideoTracks().length}`);
            });
          }
        }, 100);
      }
    } catch (err: any) {
      alert(`Camera start error: ${err.name} - ${err.message}`);
      setGlobalError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraActive(false);
  };

  const snapImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const snappedFile = new File([blob], `camera-snapshot-${Date.now()}.jpg`, { type: "image/jpeg" });
          addFiles([snappedFile]);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;

    setLoading(true);
    setGlobalError(null);

    const formData = new FormData();
    images.forEach((img) => {
      formData.append("images", img.file);
    });

    try {
      // Send to NestJS API Gateway
      const response = await fetch("https://api-gateway-6sem.onrender.com/diagnose", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze the images.");

      const data = await response.json();
      
      setImages((prev) =>
        prev.map((img) => {
          const res = data.find((d: any) => d.filename === img.file.name);
          if (res) {
            return { ...img, result: res };
          }
          return img;
        })
      );
    } catch (err: any) {
      setGlobalError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImages([]);
    setGlobalError(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const allAnalyzed = images.length > 0 && images.every((img) => img.result);
  const showUploadZone = !isCameraActive && !allAnalyzed;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans flex flex-col items-center py-8 md:py-16 px-4 sm:px-6">
      <div className="max-w-4xl w-full">
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          {/* Leaf icon */}
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-2xl bg-green-900/30 border border-green-800/30">
              <svg className="w-8 h-8 text-green-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c4.97 0 9 4.03 9 9s-4.03 9-9 9-9-4.03-9-9 4.03-9 9-9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c0 4.97-2 8-5 10m5-10c0 4.97 2 8 5 10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-slate-50">
            Tomato Leaf Diagnostics System
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Upload or snap multiple photos of tomato leaves to instantly detect diseases in batch using advanced AI models.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 shadow-xl rounded-2xl p-5 md:p-7 transition-all duration-500">

          {/* Camera View */}
          <div className={`flex flex-col items-center space-y-6 ${!isCameraActive ? 'hidden' : ''}`}>
            <div className="relative rounded-xl overflow-hidden border border-slate-600/50 shadow-lg w-full max-w-md">
              <video ref={videoRef} autoPlay playsInline={true} muted={true} className="w-full h-auto min-h-[300px] bg-slate-900" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={stopCamera}
                className="px-5 py-2.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600/50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={snapImage}
                className="px-6 py-2.5 rounded-lg bg-green-700/80 text-green-50 font-medium hover:bg-green-700 transition-all flex items-center space-x-2 text-sm border border-green-600/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Snap Photo</span>
              </button>
            </div>
          </div>

          {/* Upload & Grid Area */}
          {!isCameraActive && (
            <div className="flex flex-col animate-fade-in-up">
              
              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                  {images.map((img) => (
                    <div key={img.id} className="relative bg-slate-800/80 border border-slate-700/60 rounded-xl overflow-hidden group shadow-lg flex flex-col h-full">
                      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                        <img src={img.preview} alt="Leaf Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        {!loading && !img.result && (
                          <button
                            onClick={() => removeImage(img.id)}
                            className="absolute top-2 right-2 bg-slate-900/80 p-1.5 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/90 border border-slate-600/50"
                          >
                            <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Result Overlay */}
                      {img.result && (
                        <div className="p-4 flex-grow flex flex-col justify-between border-t border-slate-700/50">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Condition</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${img.result.status === 'Healthy' ? 'bg-green-900/40 text-green-400 border border-green-800/40' : 'bg-red-950/40 text-red-400 border border-red-800/40'}`}>
                                {img.result.status}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-100 leading-tight mb-3">{img.result.disease_name}</p>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-slate-500 font-medium">Confidence</span>
                              <span className="font-bold text-slate-300">{img.result.confidence}%</span>
                            </div>
                            <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                              <div
                                className={`h-1.5 rounded-full animate-progress-fill ${img.result.status === 'Healthy' ? 'bg-green-500/80' : 'bg-amber-500/80'}`}
                                style={{ width: `${img.result.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Zone (Hidden when all are analyzed, shown otherwise) */}
              {showUploadZone && (
                <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className="w-full p-6 md:p-8 border border-dashed border-slate-600/60 rounded-xl bg-slate-800/30 hover:bg-slate-700/30 hover:border-slate-500/60 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <div className="p-3 bg-slate-700/50 rounded-xl mb-3 group-hover:scale-105 group-hover:bg-slate-700/70 transition-all duration-300">
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-green-400/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 0v4m0-4h4m-4 0H8" /></svg>
                    </div>
                    <h3 className="text-sm font-medium text-slate-200 mb-1">Add Images</h3>
                    <p className="text-slate-500 text-xs">Drag & drop or click to browse</p>
                    <input id="file-upload" type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
                  </div>

                  <div className="flex items-center w-full my-5">
                    <div className="flex-grow border-t border-slate-700/60"></div>
                    <span className="px-4 text-slate-500 text-xs font-medium uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-slate-700/60"></div>
                  </div>

                  <button
                    onClick={startCamera}
                    className="w-full py-3 rounded-xl bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 text-slate-300 font-medium flex items-center justify-center space-x-2 transition-all duration-300 text-sm"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Use Device Camera</span>
                  </button>
                </div>
              )}

              {globalError && (
                <div className="mt-6 bg-red-950/40 border border-red-800/40 text-red-300 px-5 py-3.5 rounded-lg flex items-center space-x-3 text-sm max-w-2xl mx-auto w-full">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{globalError}</span>
                </div>
              )}

              {/* Action Buttons */}
              {images.length > 0 && !allAnalyzed && (
                <div className="mt-8 flex justify-center w-full max-w-2xl mx-auto">
                  <button
                    onClick={analyzeImages}
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 flex justify-center items-center space-x-2.5
                      ${loading ? 'bg-slate-700/50 cursor-not-allowed text-slate-400' : 'bg-green-800/70 text-green-50 hover:bg-green-700/80 border border-green-700/40 hover:border-green-600/50 shadow-lg shadow-green-900/20'}`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Analyzing {images.length} Image{images.length > 1 ? 's' : ''}...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Run Batch Diagnostic ({images.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {allAnalyzed && (
                <div className="mt-8 flex justify-center w-full max-w-2xl mx-auto">
                  <button
                    onClick={reset}
                    className="w-full py-3.5 rounded-xl bg-slate-700/40 hover:bg-slate-700/60 transition-colors text-slate-300 font-medium text-sm border border-slate-600/30"
                  >
                    Start New Batch Analysis
                  </button>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          Powered by CNN-based deep learning model (Batch Support)
        </p>
      </div>
    </main>
  );
}
