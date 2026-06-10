import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    setError(null);
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc).');
      return;
    }
    setFile(selectedFile);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Enforce a minimum display time for the scanning animation
      const minimumDelay = new Promise(resolve => setTimeout(resolve, 3000));
      const responsePromise = axios.post('https://ai-based-skin-disease-detection-b12q.onrender.com/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const [response] = await Promise.all([responsePromise, minimumDelay]);
      
      // Send result to dashboard via state
      navigate('/dashboard', { state: { result: response.data } });
      
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the image. Please ensure the backend is running.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-12">
        <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.5 }}
           className="mb-6 inline-flex p-3 rounded-full bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark shadow-[0_0_20px_rgba(14,165,233,0.3)] dark:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
        >
           <ImageIcon className="w-8 h-8" />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight sm:text-5xl mb-4">
          AI Skin Disease Detection
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Upload a clear image of your skin concern for an instant AI-powered analysis and medical-style report.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary-dark/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center w-full h-80 rounded-xl border-2 border-dashed
              transition-all duration-300 cursor-pointer overflow-hidden
              ${isDragActive ? 'border-primary dark:border-primary-dark bg-primary/5 dark:bg-primary-dark/10 scale-[1.02]' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-primary/50 dark:hover:border-primary-dark/50 hover:shadow-inner'}
            `}
          >
            {isDragActive && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 border-4 border-primary dark:border-primary-dark rounded-xl opacity-30 blur-md pointer-events-none"
              />
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleChange} 
            />
            <motion.div 
              animate={{ y: isDragActive ? -10 : 0 }}
              className={`p-4 bg-white dark:bg-slate-900 rounded-full shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] mb-4 transition-transform duration-300 ${isDragActive && 'shadow-[0_0_20px_rgba(14,165,233,0.3)] dark:shadow-[0_0_20px_rgba(56,189,248,0.4)]'}`}
            >
              <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-primary dark:text-primary-dark' : 'text-slate-400 dark:text-slate-500'}`} />
            </motion.div>
            <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
              {isDragActive ? 'Drop image here...' : 'Click or drag image to upload'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">SVG, PNG, JPG or GIF (max. 10MB)</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            <div className="relative w-full max-w-md aspect-square mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shadow-inner group/image">
              <img 
                src={preview} 
                alt="Upload preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
              />
              {!isLoading && (
                <button 
                  onClick={removeFile}
                  className="absolute top-3 right-3 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm rounded-full text-slate-600 dark:text-slate-300 hover:text-danger dark:hover:text-danger hover:bg-white dark:hover:bg-slate-800 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 overflow-hidden">
                  {/* Laser Scanline */}
                  <div className="absolute w-full h-[2px] bg-cyan-400 dark:bg-primary-dark shadow-[0_0_20px_5px_rgba(34,211,238,0.6)] dark:shadow-[0_0_20px_5px_rgba(56,189,248,0.6)] animate-scanline mix-blend-screen" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-slate-900/60 p-4 rounded-2xl backdrop-blur-md border border-white/10 flex flex-col items-center">
                       <div className="w-12 h-12 border-4 border-primary/30 border-t-primary dark:border-primary-dark/30 dark:border-t-primary-dark rounded-full animate-spin mb-3"></div>
                       <span className="text-white text-xs font-bold tracking-wider uppercase animate-pulse">Scanning</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 font-medium mb-8">
              <ImageIcon className="w-5 h-5 text-primary dark:text-primary-dark" />
              <span className="truncate max-w-[250px]">{file?.name}</span>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={isLoading}
              className={`
                w-full max-w-md py-3.5 px-4 rounded-xl font-bold text-white text-lg
                transition-all duration-300 flex items-center justify-center relative overflow-hidden
                ${isLoading ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-600 dark:from-primary-dark dark:to-indigo-500 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transform hover:-translate-y-0.5'}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Scan...
                </>
              ) : (
                'Initialize AI Scan'
              )}
              {/* Shine effect */}
              {!isLoading && (
                 <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 hover:animate-shine pointer-events-none" />
              )}
            </button>
          </motion.div>
        )}
        
        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-danger/10 dark:bg-danger/20 border border-danger/20 dark:border-danger/30 rounded-xl flex items-start text-danger dark:text-red-400">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
