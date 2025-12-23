
import React, { useState, useRef, useEffect } from 'react';
import { FileData, ChatMessage as ChatMessageType } from './types';
import FileUpload from './components/FileUpload';
import ChatMessage from './components/ChatMessage';
import { askQuestionAboutFiles } from './services/geminiService';

const App: React.FC = () => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [history, setHistory] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  // Loading steps animation
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setLoadingStep(0);
      interval = window.setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1250);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (files.length === 0) {
      setError("Please upload documents or PDFs first.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const question = input.trim();
    const userMessage: ChatMessageType = {
      role: 'user',
      content: question,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const [answer] = await Promise.all([
        askQuestionAboutFiles(files, history, question),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      const modelMessage: ChatMessageType = {
        role: 'model',
        content: answer as string,
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the conversation?")) {
      setHistory([]);
    }
  };

  const downloadHistory = () => {
    if (history.length === 0) return;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `chat-history-${timestamp}.txt`;
    
    let content = `PMAD AI Assistant - Chat History\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `--------------------------------------------------\n\n`;

    history.forEach((msg) => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      content += `[${time}] ${role}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLoadingMessage = () => {
    switch(loadingStep) {
      case 0: return "Accessing document library...";
      case 1: return "Parsing context from secure PDFs...";
      case 2: return "Analyzing data and content...";
      case 3: return "Generating response...";
      default: return "Processing...";
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 font-sans">
      {/* Sidebar for File Uploads */}
      <FileUpload 
        files={files} 
        onFilesChange={setFiles} 
        isLoading={isLoading} 
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-xl">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center border border-emerald-800 shadow-sm">
               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-emerald-900 leading-tight">PMAD AI Document Assistant</h1>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.15em]">Internal Research Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={downloadHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-30 disabled:hover:text-emerald-700 transition-colors uppercase tracking-wider"
              title="Download conversation as TXT"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Logs
            </button>
            <button 
              onClick={clearChat}
              disabled={history.length === 0}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 scrollbar-thin scrollbar-thumb-slate-200">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09a13.916 13.916 0 002.522-3.991m1.213-4.64l.056-.013c1.474-.333 2.68-1.34 3.203-2.692M8 21l.515-.856A12.037 12.037 0 019.662 18M12 11V5a2 2 0 012-2h4a2 2 0 012 2v10a2 2 0 01-2 2h-1M10 11l2-2m0 0l2 2m-2-2v4m-8 2h4a2 2 0 012 2v3m-6 0h1" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-emerald-900 mb-2">Internal Document Search</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">Securely upload regulations, reports, or manuals to query information instantly using AI.</p>
              <div className="grid grid-cols-1 gap-2 w-full text-left">
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs font-medium text-emerald-800">
                  "Summarize the key points from the uploaded documents."
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs font-medium text-emerald-800">
                  "Find specific dates and deadlines mentioned in the text."
                </div>
              </div>
            </div>
          ) : (
            <>
              {history.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center mr-3 shadow-md border border-emerald-800">
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                    </svg>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl rounded-tl-none px-5 py-4 border border-emerald-200 min-w-[240px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-500 ease-linear" style={{ width: `${(loadingStep + 1) * 25}%` }}></div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest animate-pulse">
                          Assistant Processing
                        </span>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                      <p className="text-emerald-600 text-[13px] font-medium transition-all duration-300 italic">
                        {getLoadingMessage()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <footer className="p-4 md:p-6 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            {error && (
              <div className="absolute -top-12 left-0 right-0 bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 animate-in fade-in slide-in-from-bottom-2">
                {error}
              </div>
            )}
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={files.length === 0 ? "First, upload PDF files..." : "Ask a question about your documents..."}
                disabled={isLoading}
                className="w-full pl-5 pr-16 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 placeholder-slate-400 text-sm md:text-base transition-all disabled:opacity-50 shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || files.length === 0}
                className="absolute right-2.5 p-2.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-center text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold">
              Proprietary System — Professional Use Only
            </p>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default App;
