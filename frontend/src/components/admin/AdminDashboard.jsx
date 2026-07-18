import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function AdminDashboard({ adminToken, setAdminToken }) {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [tickets, setTickets] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTickets, setSelectedTickets] = useState([]);
  
  const [selectedTicketForChat, setSelectedTicketForChat] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [adminChatMessage, setAdminChatMessage] = useState('');
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const mockChartData = [
    { time: '08:00', volume: 12 },
    { time: '10:00', volume: 25 },
    { time: '12:00', volume: 18 },
    { time: '14:00', volume: 32 },
    { time: '16:00', volume: 28 },
    { time: '18:00', volume: 45 },
    { time: '20:00', volume: 38 },
  ];

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (adminToken) {
      fetchTickets(adminToken);
    }
  }, [adminToken]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setAdminToken(data.data.token);
      localStorage.setItem('adminToken', data.data.token);
      fetchTickets(data.data.token);
    } catch (err) {
      setLoginError(err.message);
      toast.error("Login failed: " + err.message);
    }
  };

  const fetchTickets = async (token) => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/admin/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tickets", err);
      toast.error("Failed to load tickets");
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleUpdateTicket = async (id, status) => {
    try {
      await fetch(`/admin/tickets/${id}`, {
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

  const handleBulkResolve = async () => {
    try {
      await Promise.all(selectedTickets.map(id => 
        fetch(`/admin/tickets/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ status: 'resolved' })
        })
      ));
      fetchTickets(adminToken);
      setSelectedTickets([]);
      toast.success(`${selectedTickets.length} tickets resolved successfully`);
    } catch (err) {
      toast.error("Failed to resolve tickets");
    }
  };

  const toggleTicketSelection = (id) => {
    setSelectedTickets(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const openTicketChat = async (ticket) => {
    setSelectedTicketForChat(ticket);
    setShowAuditTrail(false);
    try {
      const res = await fetch(`/admin/tickets/${ticket.id}/messages`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTicketMessages(data.data || []);
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
      await fetch(`/admin/tickets/${selectedTicketForChat.id}/reply`, {
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
      const response = await fetch('/upload-document', {
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

  const handleExportCSV = () => {
    const headers = ['ID,Entity,Summary,Priority,Status'];
    const rows = filteredTickets.map(t => `${t.ticket_number},${t.user_email || 'Unknown'},"${t.summary}",${t.priority},${t.status}`);
    const csv = headers.concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streams_export_${new Date().getTime()}.csv`;
    a.click();
    toast.success("Data exported to CSV");
  };

  if (!adminToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full relative bg-slate-950">
        <div className="w-full max-w-sm bg-slate-900 border border-white/5 rounded-xl p-8 relative z-10">
          <h2 className="text-2xl font-bold mb-2 text-center text-slate-50 tracking-tight">System Auth</h2>
          <p className="text-center text-indigo-400/60 text-xs font-mono mb-8 uppercase tracking-widest">Secure Area</p>
          <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg text-center font-mono">
                AUTH_FAILURE: {loginError}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={adminUsername} 
                onChange={e => { setAdminUsername(e.target.value); setLoginError(''); }} 
                required 
                className={`w-full bg-slate-900/40 border ${loginError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-indigo-600'} rounded-xl px-4 py-4 text-slate-50 font-mono focus:outline-none focus:ring-1 ${loginError ? 'focus:ring-red-500/50' : 'focus:ring-indigo-600/50'} transition-all duration-300 ease-out placeholder-slate-500 shadow-inner`}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={adminPassword} 
                onChange={e => { setAdminPassword(e.target.value); setLoginError(''); }} 
                required 
                className={`w-full bg-slate-900/40 border ${loginError ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-indigo-600'} rounded-xl px-4 py-4 text-slate-50 font-mono focus:outline-none focus:ring-1 ${loginError ? 'focus:ring-red-500/50' : 'focus:ring-indigo-600/50'} transition-all duration-300 ease-out placeholder-slate-500 shadow-inner`}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-slate-50 font-bold py-4 rounded-xl transition-all duration-300 ease-out mt-4">
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.user_email && t.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          t.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'open' && (t.status === 'open' || t.status === 'in_progress')) ||
                          (filterStatus === 'resolved' && (t.status === 'resolved' || t.status === 'closed'));
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight flex items-center gap-3">
              Ops Command 
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">Real-time telemetry and escalation management</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="bg-slate-900 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-all duration-300 ease-out w-64 relative z-10"
              />
            </div>
            <button 
              aria-label="Export CSV"
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 rounded-xl px-6 py-3 font-medium transition-all duration-300 ease-out flex items-center gap-2 text-sm" 
              onClick={handleExportCSV}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export
            </button>
            <button 
              aria-label="Sync Data"
              className="bg-indigo-600 hover:bg-indigo-500 text-slate-50 border border-indigo-500/50 rounded-xl px-6 py-3 font-medium transition-all duration-300 ease-out flex items-center gap-2 text-sm" 
              onClick={() => fetchTickets(adminToken)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Sync Data
            </button>
          </div>
        </header>

        {/* Bento Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          
          {/* Stats Bento Box (Span 8) */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-8 bg-slate-900 border border-white/5 rounded-xl p-8 relative overflow-hidden flex flex-col justify-between"
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Queue Telemetry</h3>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-white/5 transition-all duration-300 hover:bg-slate-700">
                <div className="text-slate-400 text-sm font-medium mb-2">Total Signals</div>
                <div className="text-4xl font-bold text-slate-50 font-sans tracking-tight">{totalTickets}</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-white/5 relative overflow-hidden group transition-all duration-300 hover:bg-slate-700">
                <div className="text-amber-400 text-sm font-medium mb-2 relative z-10">Active</div>
                <div className="text-4xl font-bold text-slate-50 font-sans tracking-tight relative z-10">{openTickets}</div>
              </div>
              <div className="bg-slate-800 rounded-xl p-6 border border-white/5 relative overflow-hidden group transition-all duration-300 hover:bg-slate-700">
                <div className="text-emerald-400 text-sm font-medium mb-2 relative z-10">Resolved</div>
                <div className="text-4xl font-bold text-slate-50 font-sans tracking-tight relative z-10">{resolvedTickets}</div>
              </div>
            </div>

            <div className="h-40 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.1)" tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: '#c4b5fd' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Upload Bento Box (Span 4) */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-4 bg-slate-900 border border-white/5 rounded-xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center group hover:border-indigo-600/30 transition-all duration-300 ease-out cursor-pointer" 
            onClick={() => !isUploading && fileInputRef.current.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center mb-6 border border-white/5 transition-transform duration-300 group-hover:bg-indigo-600 group-hover:border-indigo-500">
              {isUploading ? (
                <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-slate-50 tracking-tight mb-2">Ingest Knowledge</h3>
            <p className="text-slate-400 font-medium text-xs max-w-[200px]">Train the AI matrix with new documents & PDFs.</p>
            
            {uploadStatus && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-md animate-fade-in">
                {uploadStatus}
              </div>
            )}
          </motion.div>

          {/* Tickets Table Bento Box (Span 12) */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="md:col-span-12 bg-slate-900 border border-white/5 rounded-xl overflow-hidden flex flex-col h-[600px] relative"
          >
            <div className="px-6 py-5 border-b border-white/5 bg-slate-900 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative">
              <h3 className="font-bold text-slate-50 tracking-wide">Active Protocol Streams</h3>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-900/40 rounded-full p-1 border border-white/5">
                  {['all', 'open', 'resolved'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ease-out ${filterStatus === status ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-900/60 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
              <div className="col-span-1 flex justify-center">
                <button 
                  aria-label="Select All"
                  onClick={() => setSelectedTickets(selectedTickets.length === filteredTickets.length ? [] : filteredTickets.map(t => t.id))}
                  className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-300 ease-out ${selectedTickets.length === filteredTickets.length && filteredTickets.length > 0 ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 hover:border-white/30'}`}
                >
                  {selectedTickets.length === filteredTickets.length && filteredTickets.length > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </button>
              </div>
              <div className="col-span-2">ID</div>
              <div className="col-span-2">Entity</div>
              <div className="col-span-3">Vector Data</div>
              <div className="col-span-2">State</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoadingTickets ? (
                <div className="p-6 flex flex-col gap-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-6 items-center">
                      <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-4 flex-1 bg-white/5 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm">NO_DATA_STREAMS_FOUND</div>
              ) : (
                <AnimatePresence>
                  {filteredTickets.map((t, i) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`grid grid-cols-12 gap-4 px-6 p-5 items-center transition-all duration-300 ease-out group ${i !== filteredTickets.length - 1 ? 'border-b border-white/5' : ''} hover:bg-slate-900/40 cursor-pointer`}
                      onClick={() => toggleTicketSelection(t.id)}
                    >
                      <div className="col-span-1 flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          aria-label="Select Ticket"
                          onClick={() => toggleTicketSelection(t.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-300 ease-out ${selectedTickets.includes(t.id) ? 'bg-indigo-600 border-indigo-500' : 'border-white/10 hover:border-white/30'}`}
                        >
                          {selectedTickets.includes(t.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </button>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="font-mono text-sm text-indigo-400 tracking-wider font-medium">{t.ticket_number}</span>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="text-sm font-medium text-slate-50 truncate">{t.user_email || 'Unknown Entity'}</div>
                        {t.priority.toLowerCase() === 'high' && (
                          <span className="inline-flex mt-2 text-[10px] uppercase font-bold text-red-400 tracking-widest border border-red-500/30 px-2 py-0.5 rounded">CRITICAL</span>
                        )}
                      </div>
                      
                      <div className="col-span-3 text-sm text-slate-400 truncate pr-4 font-mono">
                        {t.summary}
                      </div>
                      
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
                          ${t.status === 'open' || t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                            t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            'bg-slate-800 text-slate-500 border-white/5'}`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="col-span-2 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                        <button 
                          aria-label="Connect to Ticket"
                          className="text-[10px] font-bold px-4 py-2 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-600/30 transition-all duration-300 ease-out uppercase tracking-wider"
                          onClick={(e) => { e.stopPropagation(); openTicketChat(t); }}
                        >
                          Connect
                        </button>
                        {t.status !== 'resolved' && t.status !== 'closed' && (
                          <button 
                            className="text-[10px] font-bold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all duration-300 ease-out uppercase tracking-wider"
                            onClick={(e) => { e.stopPropagation(); handleUpdateTicket(t.id, 'resolved'); }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
              {selectedTickets.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-indigo-600/30 px-8 py-4 rounded-xl flex items-center gap-8 z-20"
                >
                  <div className="text-slate-50 font-mono text-xs">
                    <span className="text-indigo-400 font-bold">{selectedTickets.length}</span> STREAMS SELECTED
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleBulkResolve}
                      className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 ease-out"
                    >
                      Resolve All
                    </button>
                    <button 
                      onClick={() => setSelectedTickets([])}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all duration-300 ease-out"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Ticket Chat Modal (Sci-Fi Overlay) */}
          <AnimatePresence>
            {selectedTicketForChat && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                {/* Blur backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedTicketForChat(null)}></div>
                
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  className="bg-slate-900 rounded-xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh] relative z-10 border border-white/5"
                >
                  <header className="px-6 py-6 border-b border-white/5 bg-slate-900 flex items-center justify-between relative">
                  <div>
                    <h3 className="font-bold text-slate-50 tracking-wide flex items-center gap-3">
                      Secure Comm Channel
                      <span className="text-indigo-400 font-mono text-xs bg-indigo-600/10 px-2 py-1 rounded border border-indigo-600/20">
                        {selectedTicketForChat.ticket_number}
                      </span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setShowAuditTrail(!showAuditTrail)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ease-out border ${showAuditTrail ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-slate-200'}`}
                    >
                      Audit Trail
                    </button>
                    <button 
                      aria-label="Close Modal"
                      onClick={() => setSelectedTicketForChat(null)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-all duration-300 ease-out"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-950">
                  {showAuditTrail ? (
                    <div className="flex flex-col gap-6 relative">
                      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-600/50 to-transparent"></div>
                      {[
                        { time: '10:00 AM', event: 'Stream Initialized', user: 'SYSTEM' },
                        { time: '10:02 AM', event: 'Priority Upgraded to HIGH', user: 'AI Matrix' },
                        { time: '11:45 AM', event: 'Admin Connected', user: 'SysAdmin' }
                      ].map((evt, idx) => (
                        <div key={idx} className="flex gap-4 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold text-indigo-400">{idx + 1}</div>
                          <div className="bg-slate-800 p-4 rounded-xl flex-1 border border-white/5 transition-all duration-300 ease-out hover:bg-slate-700">
                            <div className="font-bold text-slate-50 text-sm">{evt.event}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">Initiated by {evt.user} at {evt.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : ticketMessages.length === 0 ? (
                    <div className="text-center text-slate-500 font-mono text-sm mt-10">AWAITING_TRANSMISSION</div>
                  ) : (
                    ticketMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-6 py-4 rounded-lg text-sm relative group ${
                          msg.sender === 'admin' 
                            ? 'bg-slate-900 border border-white/5 text-slate-50' 
                            : 'bg-slate-900 border border-white/5 text-slate-50'
                        }`}>
                          <div className="font-bold text-[10px] uppercase tracking-widest mb-2 opacity-60 flex justify-between gap-6 font-mono text-indigo-300">
                            <span>{msg.sender === 'admin' ? 'SYS_ADMIN' : 'USER_NODE'}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                          </div>
                          <div className="font-sans leading-relaxed text-slate-300" style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {!showAuditTrail && (
                  <div className="p-6 bg-slate-900 border-t border-white/5">
                    <form onSubmit={handleSendAdminReply} className="flex gap-4">
                      <input 
                        type="text" 
                        value={adminChatMessage}
                        onChange={(e) => setAdminChatMessage(e.target.value)}
                        placeholder="Transmit message..."
                        autoFocus
                        className="flex-1 bg-slate-950 border border-white/5 rounded-md px-6 py-4 text-sm font-mono text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-all duration-300 ease-out"
                      />
                      <button 
                        type="submit"
                        aria-label="Send Message"
                        disabled={!adminChatMessage.trim()}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border disabled:border-white/5 text-slate-50 rounded-md font-bold uppercase tracking-wider text-xs transition-all duration-300 ease-out flex items-center gap-2"
                      >
                        Send
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>

        </motion.div>
      </div>
    </div>
  );
}

export default AdminDashboard;
