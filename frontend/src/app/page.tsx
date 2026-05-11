"use client";

import React, { useState, useRef, useCallback } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ disease_name: string; confidence: number; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (selectedFile: File) => {
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
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
          const snappedFile = new File([blob], "camera-snapshot.jpg", { type: "image/jpeg" });
          handleFile(snappedFile);
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const analyzeImage = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Send to NestJS API Gateway
      const response = await fetch("https://api-gateway-6sem.onrender.com/diagnose", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze the image.");

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans flex flex-col items-center py-8 md:py-16 px-4 sm:px-6">
      <div className="max-w-2xl w-full">
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
            Upload or snap a photo of a tomato leaf to instantly detect diseases using advanced AI models.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/40 backdrop-blur-lg border border-slate-700/50 shadow-xl rounded-2xl p-5 md:p-7 transition-all duration-500">

          {/* Camera View */}
          {isCameraActive ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="relative rounded-xl overflow-hidden border border-slate-600/50 shadow-lg">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-md h-auto" />
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
          ) : !preview ? (
            /* Upload/Snap Zone */
            <div className="flex flex-col items-center">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="w-full p-6 md:p-10 border border-dashed border-slate-600/60 rounded-xl bg-slate-800/30 hover:bg-slate-700/30 hover:border-slate-500/60 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="p-3.5 bg-slate-700/50 rounded-xl mb-4 group-hover:scale-105 group-hover:bg-slate-700/70 transition-all duration-300">
                  <svg className="w-8 h-8 text-slate-400 group-hover:text-green-400/80 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <h3 className="text-base font-medium text-slate-200 mb-1">Drag & Drop Image</h3>
                <p className="text-slate-500 text-sm">or click to browse your files</p>
                <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>

              <div className="flex items-center w-full my-6">
                <div className="flex-grow border-t border-slate-700/60"></div>
                <span className="px-4 text-slate-500 text-xs font-medium uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-700/60"></div>
              </div>

              <button
                onClick={startCamera}
                className="w-full py-3.5 rounded-xl bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/40 text-slate-300 font-medium flex items-center justify-center space-x-2.5 transition-all duration-300 text-sm"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Use Device Camera</span>
              </button>
            </div>
          ) : (
            /* Preview & Results Zone */
            <div className="flex flex-col items-center animate-fade-in-up">
              <div className="relative rounded-xl overflow-hidden border border-slate-700/50 shadow-lg mb-6 group">
                <img src={preview} alt="Leaf Preview" className="w-full max-w-md h-auto object-cover" />
                {!result && !loading && (
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 bg-slate-900/70 p-1.5 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/70 border border-slate-600/30"
                  >
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-800/40 text-red-300 px-5 py-3.5 rounded-lg mb-5 flex items-center space-x-3 text-sm">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              {!result ? (
                <button
                  onClick={analyzeImage}
                  disabled={loading}
                  className={`w-full max-w-xs py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 flex justify-center items-center space-x-2.5
                    ${loading ? 'bg-slate-700/50 cursor-not-allowed text-slate-400' : 'bg-green-800/70 text-green-50 hover:bg-green-700/80 border border-green-700/40 hover:border-green-600/50'}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Analyzing Pathogens...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <span>Run Diagnostic</span>
                    </>
                  )}
                </button>
              ) : (
                /* Results Card */
                <div className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 backdrop-blur-md animate-fade-in-up">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base font-semibold text-slate-200">Diagnostic Report</h3>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${result.status === 'Healthy' ? 'bg-green-900/40 text-green-400 border border-green-800/40' : 'bg-red-950/40 text-red-400 border border-red-800/40'}`}>
                      {result.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Detected Condition</p>
                      <p className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">{result.disease_name}</p>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Confidence Level</span>
                        <span className="font-bold text-slate-200 text-sm">{result.confidence}%</span>
                      </div>
                      <div className="w-full bg-slate-900/60 rounded-full h-2 overflow-hidden border border-slate-700/30">
                        <div
                          className={`h-2 rounded-full animate-progress-fill ${result.status === 'Healthy' ? 'bg-green-600/80' : 'bg-amber-600/80'}`}
                          style={{ width: `${result.confidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={reset}
                    className="w-full mt-6 py-3 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 transition-colors text-slate-300 font-medium text-sm border border-slate-600/30"
                  >
                    Analyze Another Leaf
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          Powered by CNN-based deep learning model
        </p>
      </div>
    </main>
  );
}
