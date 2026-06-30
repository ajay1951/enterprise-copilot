import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

function AdminDashboard({ adminToken, setAdminToken }) {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [tickets, setTickets] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedTicketForChat, setSelectedTicketForChat] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [adminChatMessage, setAdminChatMessage] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (adminToken) {
      fetchTickets(adminToken);
    }
  }, [adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setAdminToken(data.token);
      localStorage.setItem('adminToken', data.token);
      fetchTickets(data.token);
    } catch (err) {
      toast.error("Login failed: " + err.message);
    }
  };

  const fetchTickets = async (token) => {
    try {
      const res = await fetch('http://localhost:8000/admin/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      toast.error("Failed to load tickets");
    }
  };

  const handleUpdateTicket = async (id, status) => {
    try {
      await fetch(`http://localhost:8000/admin/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ status })
      });
      fetchTickets(adminToken);
      toast.success("Ticket updated successfully");
    } catch (err) {
      toast.error("Failed to update ticket");
    }
  };

  const openTicketChat = async (ticket) => {
    setSelectedTicketForChat(ticket);
    try {
      const res = await fetch(`http://localhost:8000/admin/tickets/${ticket.id}/messages`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      toast.error("Failed to load messages");
    }
  };

  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminChatMessage.trim() || !selectedTicketForChat) return;
    try {
      await fetch(`http://localhost:8000/admin/tickets/${selectedTicketForChat.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ message: adminChatMessage })
      });
      setAdminChatMessage('');
      openTicketChat(selectedTicketForChat);
      toast.success("Reply sent successfully");
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setUploadStatus(`Success: ${data.message}`);
      toast.success("Document uploaded successfully!");
    } catch (error) {
      setUploadStatus(`Error: ${error.message}`);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  if (!adminToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090D16] w-full">
        <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-xl p-8 shadow-2xl animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-center text-[#F9FAFB] tracking-tight">Admin Authentication</h2>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={adminUsername} 
                onChange={e => setAdminUsername(e.target.value)} 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-[#94A3B8]/50"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={adminPassword} 
                onChange={e => setAdminPassword(e.target.value)} 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[#F9FAFB] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-[#94A3B8]/50"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors mt-2 shadow-lg shadow-indigo-500/20">Secure Login</button>
          </form>
        </div>
      </div>
    );
  }

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <div className="flex-1 p-6 lg:p-10 animate-fade-in overflow-y-auto w-full">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB] tracking-tight">Support Desk</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Manage employee escalations and knowledge base</p>
          </div>
          <button 
            className="bg-[#111827] hover:bg-white/5 text-[#F9FAFB] border border-white/10 rounded-lg px-4 py-2 font-medium transition-colors flex items-center gap-2 text-sm" 
            onClick={() => fetchTickets(adminToken)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1 flex flex-col gap-6">
            <section className="bg-[#111827] border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <h3 className="text-lg font-semibold text-[#F9FAFB] tracking-tight mb-2 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Knowledge Base
              </h3>
              <p className="text-[#94A3B8] font-light text-sm leading-relaxed mb-6">Upload PDFs or text documents to instantly train the Copilot AI.</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <button 
                className="w-full bg-white/5 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-[#F9FAFB] hover:text-indigo-300 py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 text-sm font-medium" 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading}
              >
                {isUploading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div> Uploading...</>
                ) : 'Select Document'}
              </button>
              {uploadStatus && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-lg break-words">
                  {uploadStatus}
                </div>
              )}
            </section>

            <section className="bg-[#111827] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">Queue Status</h3>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[#94A3B8] text-sm">Open Issues</span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">{openTickets}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[#94A3B8] text-sm">Resolved</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">{resolvedTickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] text-sm">Total Tickets</span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold">{totalTickets}</span>
              </div>
            </section>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#111827] border border-white/10 rounded-xl overflow-hidden shadow-lg">
              <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="font-semibold text-[#F9FAFB] tracking-tight">Active Tickets</h3>
              </div>
              
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#090D16]/50 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">
                <div className="col-span-2">Ticket ID</div>
                <div className="col-span-3">Requester</div>
                <div className="col-span-3">Summary</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              <div className="flex flex-col divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {tickets.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[#94A3B8]">No tickets found in the queue.</div>
                ) : (
                  tickets.map(t => (
                    <div key={t.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors group">
                      
                      <div className="col-span-2">
                        <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">{t.ticket_number}</span>
                      </div>
                      
                      <div className="col-span-3">
                        <div className="text-sm font-medium text-[#F9FAFB] truncate">{t.user_email || 'Unknown'}</div>
                        {t.priority.toLowerCase() === 'high' && <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-400 tracking-wide bg-red-400/10 px-2 py-0.5 rounded-sm">High Priority</span>}
                      </div>
                      
                      <div className="col-span-3 text-sm text-[#94A3B8] truncate pr-4" title={t.summary}>
                        {t.summary}
                      </div>
                      
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${t.status === 'open' || t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                        >
                          {t.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                          onClick={() => openTicketChat(t)}
                        >
                          Chat
                        </button>
                        {t.status !== 'resolved' && t.status !== 'closed' && (
                          <button 
                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                            onClick={() => handleUpdateTicket(t.id, 'resolved')}
                          >
                            Resolve
                          </button>
                        )}
                        {t.status !== 'closed' && (
                          <button 
                            className="text-xs font-medium px-3 py-1.5 rounded-md bg-white/5 text-[#94A3B8] hover:bg-white/10 hover:text-[#F9FAFB] border border-white/5 transition-colors"
                            onClick={() => handleUpdateTicket(t.id, 'closed')}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {selectedTicketForChat && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
                
                <header className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#F9FAFB] flex items-center gap-2">
                      <span className="text-indigo-400 font-mono text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {selectedTicketForChat.ticket_number}
                      </span>
                      User Thread
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1 truncate max-w-sm">{selectedTicketForChat.summary}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedTicketForChat(null)}
                    className="p-2 rounded-lg text-[#94A3B8] hover:bg-white/10 hover:text-[#F9FAFB] transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#090D16]">
                  {ticketMessages.length === 0 ? (
                    <div className="text-center text-[#94A3B8] text-sm mt-10 flex flex-col items-center gap-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    ticketMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                          msg.sender === 'admin' 
                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-[#F9FAFB] rounded-br-sm' 
                            : 'bg-white/5 border border-white/10 text-[#F9FAFB] rounded-bl-sm'
                        }`}>
                          <div className="font-bold text-[10px] uppercase tracking-wider mb-1 opacity-50 flex justify-between gap-4">
                            <span>{msg.sender === 'admin' ? 'You (Admin)' : 'User'}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 bg-[#111827] border-t border-white/10">
                  <form onSubmit={handleSendAdminReply} className="flex gap-3">
                    <input 
                      type="text" 
                      value={adminChatMessage}
                      onChange={(e) => setAdminChatMessage(e.target.value)}
                      placeholder="Type your reply to the user..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!adminChatMessage.trim()}
                      className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-[#94A3B8] text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      Send
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
