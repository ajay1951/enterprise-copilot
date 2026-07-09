import React from 'react';

/**
 * @component Sidebar
 * @description Renders the main navigation and user profile status for the Copilot OS.
 * Determines render state based on the current 'view' (chat vs admin) and access token.
 * 
 * @param {Object} props
 * @param {string} props.view - The active UI state ('chat' or 'admin').
 * @param {Function} props.setView - State setter for the active view.
 * @param {string} props.adminToken - The JWT token confirming IT Administrator access.
 * @param {Function} props.setAdminToken - State setter for the admin token.
 * @param {Function} props.setIsSettingsOpen - Toggles the settings modal visibility.
 */
const Sidebar = ({ view, setView, adminToken, setAdminToken, setIsSettingsOpen }) => {
  return (
    <aside className="w-[280px] h-full flex-shrink-0 bg-slate-900 border-r border-white/5 flex flex-col z-20 overflow-hidden relative group rounded-none">
      <div className="p-6 flex items-center gap-4 relative z-10 border-b border-white/5">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-500/50">
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
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-left relative group
            ${view === 'chat'
              ? 'bg-slate-800 text-slate-50 border border-transparent'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50 border border-transparent'}`}
          onClick={() => setView('chat')}
        >
          {view === 'chat' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-md" />}
          <svg className={`transition-colors duration-300 ${view === 'chat' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="relative z-10">AI Assistant</span>
        </button>

        <button
          aria-label="Navigate to Admin Dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-left relative group
            ${view === 'admin'
              ? 'bg-slate-800 text-slate-50 border border-transparent'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-50 border border-transparent'}`}
          onClick={() => setView('admin')}
        >
          {view === 'admin' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-md" />}
          <svg className={`transition-colors duration-300 ${view === 'admin' ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          <span className="relative z-10">Admin Dashboard</span>
        </button>

        <button
          aria-label="Open System Settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full text-left relative group text-slate-400 hover:bg-slate-800 hover:text-slate-50 border border-transparent mt-2"
          onClick={() => setIsSettingsOpen(true)}
        >
          <svg className="transition-colors duration-300 text-white/40 group-hover:text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span className="relative z-10">System Settings</span>
        </button>
      </nav>

      <div className="mt-auto p-4 relative z-10 border-t border-white/5 bg-slate-900">
        <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-slate-800 border border-white/5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold border border-white/5
            ${adminToken ? 'bg-indigo-600 text-slate-50' : 'bg-slate-700 text-slate-400'}`}>
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
  );
};

export default Sidebar;
