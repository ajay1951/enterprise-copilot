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
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let aiMessageContent = "";
      setMessages((prev) => [...prev, { content: "", role: 'ai' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                toast.error(data.error);
                setMessages((prev) => [...prev, { content: 'ERROR: ' + data.error, role: 'error' }]);
                break;
              }
              if (data.text) {
                aiMessageContent += data.text;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = aiMessageContent;
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore partial JSON chunks if they split awkwardly, though rare with our backend setup
            }
          }
        }
      }
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
    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden h-full relative">

      <div className="w-full h-full flex flex-col overflow-hidden relative z-10 bg-slate-950">

        <header className="px-8 py-8 border-b border-white/5 bg-slate-900/40 flex items-center justify-between relative backdrop-blur-xl">

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center border border-indigo-500/50 relative z-10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2">
                Enterprise Copilot
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest mt-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Neural Link Active
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="bg-slate-900 border border-white/5 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-all w-56 relative z-10"
              />
            </div>
            <div className="px-3 py-1.5 rounded-md bg-slate-900 border border-white/5 text-slate-400 text-[10px] font-bold tracking-widest uppercase font-mono">
              SESSION: {sessionInfo.id.split('-')[1]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-slate-950 w-full max-w-5xl mx-auto">
          <AnimatePresence>
            {messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-5 py-4 rounded-lg relative group transition-all duration-300 ease-out ${msg.role === 'user'
                  ? 'bg-slate-900 border border-white/5 text-slate-50'
                  : msg.role === 'error'
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                    : 'bg-slate-900 border border-white/5 text-slate-50'
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
                <div className="bg-slate-900 border border-white/5 px-5 py-4 rounded-lg flex flex-col gap-3">
                  <div className="font-bold text-[9px] uppercase tracking-widest font-mono text-indigo-400 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon></svg> AI Matrix
                  </div>
                  <div className="flex gap-2 items-center h-6">
                    <div className="w-2 h-2 bg-indigo-500 rounded-sm animate-pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-sm animate-pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-indigo-300 rounded-sm animate-pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-900 border-t border-white/5 relative z-20">
          
          <div className="max-w-5xl mx-auto flex flex-col relative gap-2">
            <div className="absolute -top-14 right-4 z-20 group/tooltip">
              <button
                type="button"
                aria-label="Quick Attach"
                onClick={() => chatAttachmentRef.current.click()}
                className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center border border-indigo-500/50 hover:bg-indigo-500 transition-colors group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 border border-white/5 rounded-md text-[10px] font-bold text-slate-50 whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none uppercase tracking-wider">
                Upload Data
              </div>
          </div>

          <form onSubmit={handleSendMessage} className="relative w-full flex flex-col gap-3">
            {chatAttachment && (
              <div className="flex items-center gap-2 bg-slate-800 border border-white/5 px-3 py-1.5 rounded-md w-max ml-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span className="text-xs font-mono text-indigo-300 font-bold truncate max-w-[200px]">{chatAttachment.name}</span>
                <button type="button" aria-label="Remove Attachment" onClick={() => setChatAttachment(null)} className="text-slate-400 hover:text-red-400 ml-2 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}

            <div className="relative group">
              <button
                type="button"
                aria-label="Upload Attachment"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-500 hover:text-slate-50 hover:bg-slate-800 rounded-md flex items-center justify-center transition-colors z-10"
                onClick={() => chatAttachmentRef.current.click()}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <input type="file" ref={chatAttachmentRef} onChange={handleChatAttachmentSelect} accept="image/*" className="hidden" />

              <input
                type="text"
                className="w-full bg-slate-950 border border-white/5 rounded-md pl-12 pr-14 py-3 text-sm text-slate-50 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition-colors z-0"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Initialize query or upload visual data..."
                disabled={isLoading}
              />

              <button
                type="submit"
                aria-label="Send Message"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-md flex items-center justify-center transition-colors z-10"
                disabled={isLoading || (!inputMessage.trim() && !chatAttachment)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Neural matrix may produce artifacts. Verify critical data.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
