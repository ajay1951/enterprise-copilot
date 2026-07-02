import { useState, useEffect } from 'react';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './components/chat/ChatInterface';
import AdminDashboard from './components/admin/AdminDashboard';

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
    <div className="flex h-screen text-[#F9FAFB] font-sans overflow-hidden bg-transparent selection:bg-indigo-500/30 p-4 gap-4">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(16px)',
          color: '#F9FAFB',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />

      {/* Floating Glass Sidebar */}
      <aside className="w-[280px] flex-shrink-0 glass-panel rounded-3xl flex flex-col z-20 overflow-hidden relative group">
        {/* Subtle glow effect behind sidebar */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        <div className="p-6 flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <div>
            <span className="block font-bold tracking-tight text-lg text-white">Copilot OS</span>
            <span className="block text-[10px] font-mono text-indigo-300 uppercase tracking-widest mt-0.5 opacity-80">v2.0 Beta</span>
          </div>
        </div>

        <nav className="p-4 flex flex-col gap-2 relative z-10 mt-4">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-4 mb-2">Navigation</div>

          <button
            aria-label="Navigate to AI Assistant"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 w-full text-left relative overflow-hidden group
              ${view === 'chat'
                ? 'bg-white/10 text-white shadow-inner border border-white/10'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
            onClick={() => setView('chat')}
          >
            {view === 'chat' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
            <svg className={`transition-colors duration-300 ${view === 'chat' ? 'text-indigo-400' : 'text-white/40 group-hover:text-indigo-400'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="relative z-10">AI Assistant</span>
          </button>

          <button
            aria-label="Navigate to Admin Dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 w-full text-left relative overflow-hidden group
              ${view === 'admin'
                ? 'bg-white/10 text-white shadow-inner border border-white/10'
                : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'}`}
            onClick={() => setView('admin')}
          >
            {view === 'admin' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-400 rounded-r-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />}
            <svg className={`transition-colors duration-300 ${view === 'admin' ? 'text-purple-400' : 'text-white/40 group-hover:text-purple-400'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <span className="relative z-10">Admin Dashboard</span>
          </button>

          <button
            aria-label="Open System Settings"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 w-full text-left relative overflow-hidden group text-white/60 hover:bg-white/5 hover:text-white border border-transparent mt-2"
            onClick={() => setIsSettingsOpen(true)}
          >
            <svg className="transition-colors duration-300 text-white/40 group-hover:text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            <span className="relative z-10">System Settings</span>
          </button>
        </nav>

        <div className="mt-auto p-4 relative z-10">
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner backdrop-blur-md">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-white/20 shadow-inner
              ${adminToken ? 'bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse-glow' : 'bg-white/10 text-white/50'}`}>
              {adminToken ? 'A' : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{adminToken ? 'IT Admin' : 'Employee'}</p>
              <p className="text-[10px] text-white/50 truncate font-mono mt-0.5">{adminToken ? 'AUTH_VALID' : 'STD_ACCESS'}</p>
            </div>
          </div>
          {adminToken && (
            <button
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
              onClick={() => { setAdminToken(''); localStorage.removeItem('adminToken'); setView('chat'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Terminate Session
            </button>
          )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      <main className="flex-1 h-full glass-panel rounded-3xl overflow-hidden relative bg-black/20">
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

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}></div>
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-panel rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-md overflow-hidden relative z-10 border border-white/20"
            >
              <header className="px-6 py-5 border-b border-white/10 bg-black/20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white tracking-wide">System Settings</h3>
                  <div className="relative group/tooltip">
                    <button
                      aria-label="Close Settings"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-2 rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 border border-white/10 rounded text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">Close</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSettingsTab('system')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${settingsTab === 'system' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-transparent text-white/50 hover:bg-white/5'}`}
                  >
                    System
                  </button>
                  <button
                    onClick={() => setSettingsTab('roles')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${settingsTab === 'roles' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-transparent text-white/50 hover:bg-white/5'}`}
                  >
                    Roles & Permissions
                  </button>
                </div>
              </header>
              <div className="p-6 flex flex-col gap-6 bg-black/40 min-h-[300px]">

                {settingsTab === 'system' ? (
                  <>
                    <div>
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Preferences</h4>
                      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <span className="text-sm font-medium text-white">Visual Theme</span>
                        <button
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-500/40 border border-indigo-500/50' : 'bg-white/20 border border-white/30'}`}
                        >
                          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform transform ${theme === 'dark' ? 'translate-x-7 bg-indigo-300 shadow-[0_0_10px_rgba(165,180,252,0.8)]' : 'translate-x-0 bg-white shadow-md'}`}></div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">System Info</h4>
                      <div className="flex flex-col gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-mono text-white/60">
                        <div className="flex justify-between"><span>Core Version:</span> <span className="text-white">v2.0 Beta</span></div>
                        <div className="flex justify-between"><span>Node Status:</span> <span className="text-emerald-400">Online</span></div>
                        <div className="flex justify-between"><span>Latency:</span> <span className="text-white">12ms</span></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Access Control matrix</h4>

                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <div>
                        <div className="text-sm font-medium text-white">System Administrator</div>
                        <div className="text-[10px] text-white/50 font-mono mt-1">Full access to matrix core</div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">ACTIVE</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl opacity-50">
                      <div>
                        <div className="text-sm font-medium text-white">Standard Agent</div>
                        <div className="text-[10px] text-white/50 font-mono mt-1">Read-only queue access</div>
                      </div>
                      <span className="px-2 py-1 bg-white/5 text-white/40 border border-white/10 rounded text-[10px] font-bold">RESTRICTED</span>
                    </div>

                    <button className="mt-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white/70 transition-all border-dashed">
                      + Add Custom Role
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
