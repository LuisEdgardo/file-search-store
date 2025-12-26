import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, FileStore, ChatMessage } from '../types';
import { apiService } from '../services/api';
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatProps {
  config: AppConfig;
}

const Chat: React.FC<ChatProps> = ({ config }) => {
  const [stores, setStores] = useState<FileStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStores, setFetchingStores] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load stores on mount
  useEffect(() => {
    const loadStores = async () => {
      try {
        const data = await apiService.listStores(config);
        setStores(data);
        if (data.length > 0) {
          setSelectedStoreId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load stores for chat', err);
        setError('Could not load stores. Please check your connection.');
      } finally {
        setFetchingStores(false);
      }
    };
    loadStores();
  }, [config]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedStoreId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Llamada a la API para chat - retorna un string directamente
      const response = await apiService.chatWithStore(config, selectedStoreId, input);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response || 'No response received',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Error processing your request',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getStoreName = (id: string) => {
    const s = stores.find(store => store.id === id);
    return s ? (s.displayName || s.name) : 'Unknown Store';
  };

  if (!config.chatDocUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-8">
        <AlertCircle size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Chat not configured</h3>
        <p className="text-center max-w-md">
          Please add a <code>chatDocUrl</code> in the Settings or Hardcoded Config to enable this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 md:m-4 md:rounded-2xl md:shadow-sm md:border md:border-slate-200 dark:border-slate-700 overflow-hidden transition-colors md:w-full ">

      {/* Header / Store Selector */}
      <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 w-full max-w-md ">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Sparkles size={20} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              Chatting with
            </label>
            {fetchingStores ? (
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
            ) : stores.length === 0 ? (
              <span className="text-sm text-red-500">No stores available</span>
            ) : (
              <div className="relative group">
                <select
                  value={selectedStoreId}
                  onChange={(e) => {
                    setSelectedStoreId(e.target.value);
                    setMessages([]); // Clear chat on context switch
                  }}
                  className="w-full appearance-none bg-transparent font-medium text-slate-800 dark:text-white text-sm focus:outline-none cursor-pointer pr-6 py-1 -ml-1 pl-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                      {store.displayName || store.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30 scroll-smooth">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-50">
            <Bot size={48} className="mb-4" strokeWidth={1.5} />
            <p className="text-sm font-medium">Select a store and say hello!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1">
                <Bot size={16} />
              </div>
            )}

            <div
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-100 rounded-bl-sm'
                }`}
            >
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                    ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
                    ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
                    li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                    code: ({ node, ...props }) => <code {...props} className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono text-xs" />,
                    pre: ({ node, ...props }) => <pre {...props} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-x-auto mb-2 font-mono text-xs" />,
                    h1: ({ node, ...props }) => <h1 {...props} className="text-base font-bold mb-2 mt-3 first:mt-0" />,
                    h2: ({ node, ...props }) => <h2 {...props} className="text-sm font-bold mb-1 mt-2" />,
                    h3: ({ node, ...props }) => <h3 {...props} className="text-xs font-bold mb-1 mt-2" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0 mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-none p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something about your documents..."
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-white"
            disabled={loading || stores.length === 0}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || stores.length === 0}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400 dark:text-slate-500">AI responses may be inaccurate. Verify important information.</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;