import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "SYSTEM ONLINE. ENTERPRISE AI COPILOT INITIALIZED.\n\nHow may I assist you with your operations today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo] = useState({ id: `session-${Math.random().toString(36).substring(7)}` });
  const [chatAttachment, setChatAttachment] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const chatAttachmentRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !chatAttachment) return;

    const userMessage = {
      content: inputMessage || "Uploaded visual data",
      role: 'user',
      attachment: chatAttachment ? chatAttachment.data : null
    };

    setMessages((prev) => [...prev, userMessage]);

    const payload = {
      message: inputMessage || "Please analyze this image.",
      session_id: sessionInfo.id,
    };

    if (chatAttachment) {
      payload.attachment_data = chatAttachment.data.split(',')[1];
      payload.attachment_type = chatAttachment.type;
    }

    setInputMessage('');
    setChatAttachment(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      setMessages((prev) => [...prev, { content: data.response, role: 'ai' }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to connect to the server.');
      setMessages((prev) => [...prev, { content: 'CRITICAL ERROR: Connection to AI matrix lost.', role: 'error' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAttachmentSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Only images are supported for chat attachments currently.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_SIZE = 800;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setChatAttachment({
          data: dataUrl,
          type: 'image/jpeg',
          name: file.name
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    if (chatAttachmentRef.current) chatAttachmentRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden h-full relative">
      {/* Intense background glow for chat */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-5xl flex-1 min-h-0 flex flex-col glass-panel rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border-t border-white/20">

        <header className="px-8 py-9 border-b border-white/10 bg-black/30 flex items-center justify-between relative backdrop-blur-xl">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-md opacity-50 animate-pulse-glow"></div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 relative z-10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Enterprise Copilot
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Neural Link Active
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="bg-black/50 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner w-48 relative z-10"
              />
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-mono">
              SESSION: {sessionInfo.id.split('-')[1].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 bg-black/20">
          <AnimatePresence>
            {messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-6 py-5 rounded-3xl relative group ${msg.role === 'user'
                  ? 'bg-indigo-600/10 border border-indigo-500/20 text-white rounded-br-none shadow-[0_0_20px_rgba(99,102,241,0.05)] backdrop-blur-md'
                  : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 rounded-bl-none shadow-[0_0_20px_rgba(248,113,113,0.1)]'
                    : 'bg-black/40 border border-white/10 text-white rounded-bl-none shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md'
                  }`}>

                  {/* Meta header for bubbles */}
                  <div className={`font-bold text-[9px] uppercase tracking-widest mb-3 flex items-center gap-2 font-mono ${msg.role === 'user' ? 'text-indigo-300' : 'text-purple-300'}`}>
                    {msg.role === 'user' ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> User</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg> AI Matrix</>
                    )}
                  </div>

                  <div className="prose prose-invert prose-p:leading-relaxed max-w-none text-sm md:text-base">
                    {msg.attachment && (
                      <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group-hover:border-indigo-500/30 transition-colors inline-block bg-black">
                        <img src={msg.attachment} alt="User Upload" className="max-w-full h-auto max-h-64 object-contain" />
                      </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.role === 'error' ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 font-bold font-mono text-xs text-red-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            COMMUNICATION_FAILURE
                          </div>
                          <div className="text-red-300/80">{msg.content}</div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="bg-black/40 border border-white/10 px-6 py-5 rounded-3xl rounded-bl-none flex flex-col gap-3 backdrop-blur-md">
                  <div className="font-bold text-[9px] uppercase tracking-widest font-mono text-purple-300 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg> AI Matrix
                  </div>
                  <div className="flex gap-2 items-center h-6">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(99,102,241,0.8)]" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(168,85,247,0.8)]" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6 bg-black/40 border-t border-white/10 backdrop-blur-2xl relative">
          {/* Top glow on input area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* Floating Action Button */}
          <div className="absolute -top-16 right-6 z-20 group/tooltip">
            <button
              type="button"
              aria-label="Quick Attach"
              onClick={() => chatAttachmentRef.current.click()}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 hover:scale-110 transition-transform group"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold text-white whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-xl uppercase tracking-wider">
              Upload Data
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto flex flex-col gap-3">
            {chatAttachment && (
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-xl w-max ml-2 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span className="text-xs font-mono text-indigo-300 font-bold truncate max-w-[200px]">{chatAttachment.name}</span>
                <button type="button" aria-label="Remove Attachment" onClick={() => setChatAttachment(null)} className="text-white/40 hover:text-red-400 ml-2 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            <div className="relative group">
              <button
                type="button"
                aria-label="Upload Attachment"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 text-white/50 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-all z-10"
                onClick={() => chatAttachmentRef.current.click()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <input type="file" ref={chatAttachmentRef} onChange={handleChatAttachmentSelect} accept="image/*" className="hidden" />

              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>

              <input
                type="text"
                className="w-full bg-black/50 border border-white/10 rounded-full pl-14 pr-16 py-4 md:py-5 text-sm md:text-base text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all shadow-inner relative z-0"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Initialize query or upload visual data..."
                disabled={isLoading}
              />

              <button
                type="submit"
                aria-label="Send Message"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white text-black hover:bg-indigo-400 disabled:bg-white/10 disabled:text-white/30 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:shadow-none z-10"
                disabled={isLoading || (!inputMessage.trim() && !chatAttachment)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </form>
          <div className="text-center mt-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">Neural matrix may produce artifacts. Verify critical data.</div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
