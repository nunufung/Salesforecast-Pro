import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User, BrainCircuit, Loader2, Target, AlertTriangle, MessageSquareCode, RefreshCcw, TrendingUp } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { SalesRecord } from '../types';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

interface AICopilotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AICopilot({ isOpen: externalIsOpen, onClose: externalOnClose }: AICopilotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose !== undefined ? (val: boolean) => !val && externalOnClose() : setInternalIsOpen;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '# Strategic Intelligence Core Activated\n\nI am your specialized **Forecasting & Sales Strategy Expert**. I can analyze your pipeline to predict quarterly outcomes, identify hidden risks, and suggest growth strategies.\n\nTry asking: \n- "What is my projected Q4 revenue based on weighted win rates?"\n- "Identify high-value deals at risk of slipping."\n- "How can I optimize sector performance to hit our RMB 5M target?"' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { data, addRecord, updateRecord } = useSales();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isTyping) return;

    if (!overrideInput) {
      const userMsg: Message = { role: 'user', text: textToSend };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }
    
    setIsTyping(true);

    try {
      const history = messages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: history,
          contextData: data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        console.error("AI Expert Error:", result.error);
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `**System Alert:** ${result.error}`,
          isError: true 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: result.text || "I've processed your request." }]);

        // Handle tool calls if any
        if (result.functionCalls) {
          for (const call of result.functionCalls) {
            if (call.name === 'add_opportunity') {
              addRecord(call.args as SalesRecord);
              setMessages(prev => [...prev, { role: 'model', text: `> ✨ **Action Success:** New opportunity "${(call.args as any).itemName}" has been added to the pipeline.` }]);
            } else if (call.name === 'update_opportunity') {
              const { id, updates } = call.args as { id: string, updates: Partial<SalesRecord> };
              const existing = data.find(r => r.id === id);
              if (existing) {
                updateRecord({ ...existing, ...updates });
                setMessages(prev => [...prev, { role: 'model', text: `> 🛠️ **System Update:** Opportunity "${existing.itemName}" has been updated with: ${Object.entries(updates).map(([k, v]) => `**${k}**: ${v}`).join(', ')}.` }]);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat Error Context:", { 
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "### Protocol Interruption\n\nI'm having trouble establishing a secure line to the Intelligence Core. This could be due to a network fluctuation or a high-load state.",
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleRetry = () => {
    // Find the last user message to retry
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove the last error message from the view if possible, or just send again
      handleSend(lastUserMsg.text);
    }
  };

  return (
    <>
      {/* Floating Toggle Button - Only show if not controlled externally */}
      {externalIsOpen === undefined && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group overflow-hidden border border-slate-700 hover:border-slate-500"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[550px] bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-200"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] font-display">Intelligence Core</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Neural Engine Operational</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-10 scroll-smooth no-scrollbar"
              >
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-5 max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                        msg.role === 'user' ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-900 text-white'
                      }`}>
                        {msg.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                      </div>
                      <div className={`p-6 rounded-3xl text-[13px] leading-relaxed tracking-tight ${
                        msg.role === 'user' 
                          ? 'bg-slate-900 text-white rounded-tr-none shadow-md' 
                          : msg.isError 
                            ? 'bg-red-50 text-red-700 rounded-tl-none border border-red-100'
                            : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-200'
                      }`}>
                        <div className="prose prose-slate prose-xs max-w-none">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                        {msg.isError && (
                          <button
                            onClick={handleRetry}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm group/retry"
                          >
                            <RefreshCcw className="w-3 h-3 group-hover/retry:rotate-180 transition-transform duration-500" />
                            Retry Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-5 max-w-[90%]">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-lg shadow-slate-100">
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      </div>
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl rounded-tl-none flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions */}
              <div className="px-8 py-5 flex gap-3 overflow-x-auto no-scrollbar border-t border-slate-50 bg-slate-50/30">
                {[
                  { icon: <Target className="w-3.5 h-3.5" />, label: "Forecast Land", query: "Predict Q4 landing based on current weighted pipeline" },
                  { icon: <AlertTriangle className="w-3.5 h-3.5" />, label: "Risk Scan", query: "Show me deals over 500k with <30% win rate" },
                  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "Optimization", query: "Suggest strategies to increase win rates in the Public Sector" }
                ].map((item, id) => (
                  <button 
                    key={id}
                    onClick={() => handleSend(item.query)}
                    className="shrink-0 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 hover:text-slate-900 hover:border-slate-900 hover:shadow-md transition-all uppercase tracking-widest flex items-center gap-2.5"
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Ask the Intelligence Engine..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-6 text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 focus:bg-white focus:border-slate-400 transition-all resize-none pr-16 shadow-inner"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-5 bottom-5 w-12 h-12 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 hover:bg-black transition-all"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-8">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Intelligence Tier 6.4.2
                  </p>
                  <div className="h-[1px] w-8 bg-slate-100" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                    Secure Vault Protocol
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
