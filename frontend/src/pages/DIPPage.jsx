import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, AlertCircle, Layers, Fingerprint, ScanSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function DIPPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  
  const [pipelineData, setPipelineData] = useState([]);
  const [severity, setSeverity] = useState(null);
  const [areaRatio, setAreaRatio] = useState(null);
  const [overlayImage, setOverlayImage] = useState(null);
  
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError(null);
    setPipelineData([]);
    
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc).');
      return;
    }
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setPipelineData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:5000/process-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPipelineData(response.data.pipeline || []);
    } catch (err) {
      console.error(err);
      setError('Failed to process the image. Please ensure the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePredictROI = async () => {
    if (!preview) return;
    setIsPredicting(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/predict', {
        image: preview
      });
      navigate('/dashboard', { state: { result: response.data } });
    } catch (err) {
      console.error(err);
      setError('Failed to run AI prediction on the image.');
      setIsPredicting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center mb-2">
          <Layers className="w-8 h-8 mr-3 text-primary" /> DIP Analysis Pipeline
        </h1>
        <p className="text-slate-500">
          Advanced Skin Lesion Detection and Region of Interest (ROI) extraction using mathematical computer vision algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
              1. Feed Image
              {pipelineData.length > 0 && (
                <div className="inline-flex items-center text-xs font-bold px-2.5 py-1 bg-success/10 text-success rounded-full">
                  Processing Complete
                </div>
              )}
            </h3>
            
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center w-full h-80 rounded-xl border-2 border-dashed
                  transition-all duration-200 cursor-pointer
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary/50'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => e.target.files && handleFileSelection(e.target.files[0])} 
                />
                <UploadCloud className={`w-10 h-10 mb-3 ${isDragActive ? 'text-primary' : 'text-slate-400'}`} />
                <p className="text-sm font-medium text-slate-700">Click or drag image to scan</p>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="relative w-full aspect-square mb-6 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  {!isProcessing && (
                    <button 
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-full text-slate-600 hover:text-danger hover:bg-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {pipelineData.length === 0 && (
                  <button
                    onClick={handleUploadAndProcess}
                    disabled={isProcessing}
                    className={`
                      w-full py-3.5 rounded-xl font-semibold text-white text-lg transition-all flex items-center justify-center
                      ${isProcessing ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-md transform hover:-translate-y-0.5'}
                    `}
                  >
                    {isProcessing ? 'Extracting Lesion...' : 'Begin Segmentation'}
                  </button>
                )}
                
                {pipelineData.length > 0 && (
                  <button
                    onClick={handlePredictROI}
                    disabled={isPredicting}
                    className={`
                      w-full py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center mt-2
                      ${isPredicting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 shadow-xl ring-4 ring-slate-100 transform hover:-translate-y-0.5'}
                    `}
                  >
                    {isPredicting ? 'Passing Image to Network...' : 'Predict from Processed Image'}
                  </button>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start text-sm text-danger">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Data Visualization Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {pipelineData.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl min-h-[500px] flex flex-col items-center justify-center text-slate-400 p-12 text-center">
              <ScanSearch className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">Awaiting Image Input</h3>
              <p className="max-w-md">Upload a skin photo to the left to automatically separate the biological lesion from surrounding healthy tissue using Otsu Thresholding algorithms.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
              
              {/* Essential DIP Pipeline */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-3 text-primary" />
                  <h2 className="text-lg font-bold text-slate-800">Essential Lesion Analysis</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {pipelineData.map((step, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 outline outline-1 outline-offset-2 outline-transparent hover:outline-primary transition-all">
                          <img src={step.image} alt={step.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 mt-4 text-center px-1 leading-tight">{step.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
