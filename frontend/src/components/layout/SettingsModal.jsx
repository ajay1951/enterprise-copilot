import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsModal = ({ isSettingsOpen, setIsSettingsOpen, settingsTab, setSettingsTab, theme, setTheme }) => {
  return (
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
  );
};

export default SettingsModal;
