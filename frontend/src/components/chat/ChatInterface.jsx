import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

function ChatInterface() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hello! I am your Enterprise AI Copilot. How can I help you today?" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo] = useState({ id: `session-${Math.random().toString(36).substring(7)}` });
  const [chatAttachment, setChatAttachment] = useState(null);

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
      content: inputMessage || "Uploaded an image", 
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
      setMessages((prev) => [...prev, { content: 'Sorry, there was an error connecting to the server.', role: 'error' }]);
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden bg-[#090D16]">
      <div className="w-full max-w-4xl h-full flex flex-col bg-[#111827] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        
        <header className="px-6 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <h2 className="font-semibold text-[#F9FAFB] tracking-tight">Enterprise Copilot</h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl prose prose-invert prose-p:leading-relaxed flex flex-col gap-3 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/20 border border-indigo-500/30 text-[#F9FAFB] rounded-br-sm' 
                  : msg.role === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-bl-sm'
                  : 'bg-white/5 border border-white/10 text-[#F9FAFB] rounded-bl-sm shadow-sm'
              }`}>
                {msg.attachment && (
                  <img src={msg.attachment} alt="User Upload" className="max-w-full h-auto rounded-lg max-h-48 object-contain" />
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-[#94A3B8] rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#111827] border-t border-white/10">
          <form onSubmit={handleSendMessage} className="relative max-w-3xl mx-auto flex flex-col gap-2">
            {chatAttachment && (
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg w-max ml-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span className="text-xs text-indigo-300 font-medium truncate max-w-[200px]">{chatAttachment.name}</span>
                <button type="button" onClick={() => setChatAttachment(null)} className="text-[#94A3B8] hover:text-red-400 ml-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            <div className="relative">
              <button 
                type="button"
                className="absolute left-2 top-1.5 bottom-1.5 w-10 text-[#94A3B8] hover:text-[#F9FAFB] hover:bg-white/5 rounded-full flex items-center justify-center transition-colors"
                onClick={() => chatAttachmentRef.current.click()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>
              <input type="file" ref={chatAttachmentRef} onChange={handleChatAttachmentSelect} accept="image/*" className="hidden" />
              
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-14 py-3.5 text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all shadow-inner"
                value={inputMessage} 
                onChange={(e) => setInputMessage(e.target.value)} 
                placeholder="Ask anything or attach an image..." 
                disabled={isLoading} 
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1.5 bottom-1.5 w-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-[#94A3B8] text-white rounded-full flex items-center justify-center transition-colors"
                disabled={isLoading || (!inputMessage.trim() && !chatAttachment)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </form>
          <div className="text-center mt-3 text-[10px] text-[#94A3B8]">AI responses may be inaccurate. Check with IT for critical issues.</div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
