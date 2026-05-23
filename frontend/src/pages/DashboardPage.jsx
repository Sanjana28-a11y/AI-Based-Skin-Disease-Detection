import React from 'react';
import { useLocation, Navigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldAlert, BookOpen, Stethoscope, Activity, FileWarning, RefreshCw, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { MedicalDB } from '../medical_db';

export default function DashboardPage() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return <Navigate to="/" replace />;
  }

  const { disease, confidence, image } = result;
  const dip = location.state?.dip || {};

  // Severity Logic from DIP (preferred) fallback to confidence buckets
  let severity = dip.severity || 'Low';
  let severityColor = 'text-success bg-success/10 border-success/20';
  if (severity === 'Severe') {
    severityColor = 'text-danger bg-danger/10 border-danger/20';
  } else if (severity === 'Moderate') {
    severityColor = 'text-warning bg-warning/10 border-warning/20';
  } else if (severity === 'Mild') {
    severityColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else {
    if (confidence > 85) {
      severity = 'High';
      severityColor = 'text-danger bg-danger/10 border-danger/20';
    } else if (confidence >= 70) {
      severity = 'Medium';
      severityColor = 'text-warning bg-warning/10 border-warning/20';
    }
  }

  const dbEntry = MedicalDB[disease] || MedicalDB["Healthy"];
  
  const chartData = [
    { name: 'Confidence', value: confidence },
    { name: 'Remaining', value: 100 - confidence }
  ];
  const COLORS = ['#0ea5e9', 'rgba(148, 163, 184, 0.2)']; // Updated for dark mode visibility

  const displayImage = dip.overlayImage || image;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Diagnostic Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">AI evaluation completed successfully.</p>
        </div>
        <Link to="/" className="inline-flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 shadow-sm text-sm font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 focus:ring-primary transition-colors">
          <RefreshCw className="mr-2 h-4 w-4" /> Analyze Another
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Image & Confidence */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(56,189,248,0.1)] transition-all"
          >
            <div className="h-64 sm:h-80 lg:h-64 w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 relative">
               {displayImage ? (
                 <img src={displayImage} alt="Patient scan" className="w-full h-full object-cover rounded-xl shadow-inner border border-slate-200 dark:border-slate-800" />
               ) : (
                 <span className="text-slate-400 dark:text-slate-500">No image associated</span>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="p-6">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Primary Detection</h3>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <span className="text-3xl font-extrabold bg-gradient-to-r from-primary to-violet-500 dark:from-primary-dark dark:to-indigo-400 bg-clip-text text-transparent truncate">{disease}</span>
                <span className={`self-start sm:self-auto px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md shadow-lg shadow-current/20 ${severityColor}`}>
                  {severity}
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 relative hover:border-primary/30 transition-colors"
          >
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-primary dark:text-primary-dark" /> Confidence Score
            </h3>
            
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: 'rgb(15 23 42)', outline: 'none', border: '1px solid rgb(51 65 85)', borderRadius: '0.5rem', color: '#fff' }} itemStyle={{ color: '#0ea5e9' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{confidence}%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Medical Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {confidence < 70 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/50 rounded-2xl p-5 flex items-start"
            >
              <FileWarning className="w-6 h-6 text-warning mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-[#b45309] dark:text-yellow-500 mb-1">Uncertain – Please consult a doctor</h4>
                <p className="text-sm text-slate-700 dark:text-slate-300">The prediction confidence is {confidence}%, which is below our optimal certainty threshold of 70%. This result may not be reliable.</p>
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/50 dark:border-slate-800/50 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300"
          >
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center border-b border-transparent pb-4 relative">
              <BookOpen className="w-6 h-6 mr-3 text-primary dark:text-primary-dark" /> Medical Overview
              <div className="absolute bottom-0 left-0 h-[2px] w-24 bg-gradient-to-r from-primary to-transparent dark:from-primary-dark" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" /> About
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{dbEntry.about}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" /> Symptoms
                  </h4>
                  <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {dbEntry.symptoms.map((symptom, i) => (
                      <li key={i}>{symptom}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Causes</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{dbEntry.causes}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2 text-slate-400 dark:text-slate-500" /> Precautions
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{dbEntry.precautions}</p>
                </div>
                
                <div className="bg-primary/5 dark:bg-primary-dark/10 rounded-xl p-4 border border-primary/10 dark:border-primary-dark/20 text-glow">
                  <h4 className="text-sm font-bold text-primary dark:text-primary-dark uppercase tracking-wide mb-2 flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2" /> Basic Treatments*
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{dbEntry.treatments}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">*General guidance only. Not a prescription.</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-2">Hygiene Tips</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{dbEntry.hygiene}</p>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
