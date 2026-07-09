import { useState, useEffect } from 'react';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/chat/ChatInterface';
import AdminDashboard from './components/admin/AdminDashboard';
import Sidebar from './components/layout/Sidebar';
import SettingsModal from './components/layout/SettingsModal';

function App() {
  const [view, setView] = useState('chat');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('system');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex h-screen w-screen text-slate-50 font-sans overflow-hidden bg-slate-950 selection:bg-indigo-600/30">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(16px)',
          color: '#F9FAFB',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />

      {/* Extracted Sidebar Component */}
      <Sidebar 
        view={view} 
        setView={setView} 
        adminToken={adminToken} 
        setAdminToken={setAdminToken} 
        setIsSettingsOpen={setIsSettingsOpen} 
      />

      {/* Main Canvas Area */}
      <main className="flex-1 h-full overflow-hidden relative bg-slate-950">
        {view === 'chat' ? (
          <div className="h-full w-full">
            <ChatInterface />
          </div>
        ) : (
          <div className="h-full w-full">
            <AdminDashboard adminToken={adminToken} setAdminToken={setAdminToken} />
          </div>
        )}
      </main>

      {/* Extracted Settings Modal */}
      <SettingsModal 
        isSettingsOpen={isSettingsOpen} 
        setIsSettingsOpen={setIsSettingsOpen} 
        settingsTab={settingsTab} 
        setSettingsTab={setSettingsTab} 
        theme={theme} 
        setTheme={setTheme} 
      />
    </div>
  );
}

export default App;
