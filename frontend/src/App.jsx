import { useState } from 'react';
import './index.css';
import { Toaster } from 'react-hot-toast';
import ChatInterface from './components/chat/ChatInterface';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  const [view, setView] = useState('chat');
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');

  return (
    <div className="flex h-screen bg-[#090D16] text-[#F9FAFB] font-sans overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#111827',
          color: '#F9FAFB',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      }} />
      
      {/* Permanent Sidebar Navigation Rail */}
      <aside className="w-[260px] flex-shrink-0 bg-[#111827] border-r border-white/10 flex flex-col z-20">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <span className="font-bold tracking-tight text-[#F9FAFB]">Copilot OS</span>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest px-3 mb-1">Navigation</div>
          
          <button 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
              ${view === 'chat' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F9FAFB] border border-transparent'}`}
            onClick={() => setView('chat')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            AI Assistant
          </button>
          
          <button 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
              ${view === 'admin' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F9FAFB] border border-transparent'}`}
            onClick={() => setView('admin')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Admin Dashboard
          </button>
        </nav>

        <div className="mt-auto p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold shadow-inner">
              {adminToken ? 'A' : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#F9FAFB] truncate">{adminToken ? 'IT Admin' : 'Employee'}</p>
              <p className="text-[10px] text-[#94A3B8] truncate">{adminToken ? 'Authenticated' : 'Standard Access'}</p>
            </div>
          </div>
          {adminToken && (
            <button 
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
              onClick={() => { setAdminToken(''); localStorage.removeItem('adminToken'); setView('chat'); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Canvas Area */}
      {view === 'chat' ? <ChatInterface /> : <AdminDashboard adminToken={adminToken} setAdminToken={setAdminToken} />}

    </div>
  );
}

export default App;
