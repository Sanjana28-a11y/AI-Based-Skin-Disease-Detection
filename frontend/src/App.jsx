import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Stethoscope, UploadCloud, LayoutDashboard, History, Menu, X, Layers, Sun, Moon } from 'lucide-react';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import DIPPage from './pages/DIPPage';

function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  const links = [
    { name: 'Upload', path: '/', icon: UploadCloud },
    { name: 'Processing', path: '/dip', icon: Layers },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-4 left-4 z-30 w-64 h-[calc(100vh-2rem)] rounded-3xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/50 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] transform transition-all duration-300 ease-in-out lg:static lg:translate-x-0 lg:my-4 lg:ml-4
        ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden lg:flex items-center justify-center h-16 border-b border-slate-200 dark:border-slate-800 bg-transparent px-6">
            <Stethoscope className="h-8 w-8 text-primary dark:text-primary-dark shrink-0" />
            <span className="ml-3 font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 truncate">DermAI</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? 'bg-primary/10 dark:bg-primary-dark/20 text-primary dark:text-primary-dark shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${active ? 'text-primary dark:text-primary-dark' : 'text-slate-400 dark:text-slate-500'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
             <div className="text-xs text-center text-slate-400 dark:text-slate-500">
                Skin Disease Detection System
             </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function TopHeader({ isOpen, setIsOpen, isDarkMode, setIsDarkMode }) {
  return (
    <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-lg border border-white/50 dark:border-slate-800 sticky top-4 z-10 transition-colors duration-300 mx-4 lg:mx-8 mt-4 rounded-2xl">
      <div className="px-4 sm:px-6 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 -ml-2 mr-2 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center">
              <span className="bg-gradient-to-r from-primary to-blue-600 dark:from-primary-dark dark:to-indigo-400 bg-clip-text text-transparent">
                 Derm AI - Skin Disease Detection
              </span>
            </h1>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 ml-4 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize dark mode from localStorage or media query
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#f8fafc] dark:bg-[#030712] font-sans text-slate-900 dark:text-slate-100 selection:bg-primary dark:selection:bg-primary-dark selection:text-white transition-colors duration-300 overflow-hidden relative">
        
        {/* Organic Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 dark:bg-cyan-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none animate-blob" style={{ animationDelay: '4s' }} />
        
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          <TopHeader isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-8">
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/dip" element={<DIPPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </main>
        </div>
        
      </div>
    </BrowserRouter>
  );
}

export default App;
