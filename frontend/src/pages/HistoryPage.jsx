import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { History, Search, Calendar, Activity, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://ai-based-skin-disease-detection-b12q.onrender.com';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/history`);
        setHistory(response.data);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load history data');
        setIsLoading(false);
      }
    };
    
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.disease.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center">
            <History className="w-8 h-8 mr-3 text-primary dark:text-primary-dark" /> Analysis History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review past AI diagnosis records</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark transition-colors sm:text-sm"
            placeholder="Search conditions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-8 w-8 text-primary dark:text-primary-dark" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="bg-danger/10 text-danger dark:text-red-400 p-6 rounded-xl border border-danger/20 dark:border-danger/30 text-center">
          <p>{error}</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No analysis history found</h3>
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm ? "No records match your search criteria" : "You haven't run any AI diagnostics yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item, index) => {
            let severityColor = 'text-success bg-success/10 border-success/20';
            if (item.confidence > 85) severityColor = 'text-danger bg-danger/10 border-danger/20';
            else if (item.confidence >= 60) severityColor = 'text-warning bg-warning/10 border-warning/20';

            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id} 
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-primary/30 dark:hover:border-primary-dark/30 transition-all duration-300 cursor-default group"
              >
                <div className="h-48 w-full bg-slate-100 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 overflow-hidden relative">
                  <img src={item.image} alt={item.disease} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-md ${severityColor}`}>
                      {item.confidence}%
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 truncate">{item.disease}</h3>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {item.date}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                    Confidence: {item.confidence}%
                  </div>
                  
                  <div 
                    className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"
                    onClick={() => navigate('/dashboard', { state: { result: item } })}
                  >
                     <span className="text-sm font-medium text-primary dark:text-primary-dark flex items-center group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors cursor-pointer">
                        View Details <ChevronRight className="w-4 h-4 ml-1" />
                     </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
