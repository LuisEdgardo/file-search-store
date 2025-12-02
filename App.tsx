
import React, { useState, useEffect } from 'react';
import { AppConfig, FileStore, ViewState } from './types';
import Settings from './components/Settings';
import FileStores from './components/FileStores';
import Documents from './components/Documents';
import Chat from './components/Chat';
import { Settings as SettingsIcon, MessageSquareText, Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'n8n_filestore_config';
const THEME_KEY = 'n8n_filestore_theme';

// Configuration loaded from environment variables
const DEFAULT_CONFIG: AppConfig = {
  listStoresUrl: import.meta.env.VITE_LIST_STORES_URL || '',
  createStoreUrl: import.meta.env.VITE_CREATE_STORE_URL || '',
  deleteStoreUrl: import.meta.env.VITE_DELETE_STORE_URL || '',
  listDocsUrl: import.meta.env.VITE_LIST_DOCS_URL || '',
  uploadDocUrl: import.meta.env.VITE_UPLOAD_DOC_URL || '',
  deleteDocUrl: import.meta.env.VITE_DELETE_DOC_URL || '',
  chatDocUrl: import.meta.env.VITE_CHAT_DOC_URL || '',
};

const DevluLogo = () => (
  <>
    <img
      src="https://ltnrvtimhwhkskpeewio.supabase.co/storage/v1/object/public/imagenes/LOGO_CUADRADO.png"
      alt="Devlu Logo"
      className="h-10 w-10 object-contain rounded-lg bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm shadow-sm p-0.5"
    />
    <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
      FileSearchStores
    </span>
  </>
);

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<ViewState>(ViewState.STORES);
  const [selectedStore, setSelectedStore] = useState<FileStore | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    // Check if there's a valid default config from environment variables
    const hasDefaultConfig = Object.values(DEFAULT_CONFIG).some(v => v && v.trim().length > 0);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure backward compatibility if stored config misses new keys
        const mergedConfig = { ...DEFAULT_CONFIG, ...parsed };
        setConfig(mergedConfig);

        if (mergedConfig.listStoresUrl) {
          setView(ViewState.STORES);
        } else {
          setView(ViewState.SETTINGS);
        }
      } catch (e) {
        if (hasDefaultConfig) {
          setConfig(DEFAULT_CONFIG);
          setView(ViewState.STORES);
        } else {
          setView(ViewState.SETTINGS);
        }
      }
    } else {
      if (hasDefaultConfig) {
        setConfig(DEFAULT_CONFIG);
        setView(ViewState.STORES);
      } else {
        setView(ViewState.SETTINGS);
      }
    }
    setIsInitialized(true);
  }, []);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setView(ViewState.STORES);
  };

  const handleStoreSelect = (store: FileStore) => {
    setSelectedStore(store);
    setView(ViewState.DOCUMENTS);
  };

  const goBackToStores = () => {
    setSelectedStore(null);
    setView(ViewState.STORES);
  };

  if (!isInitialized) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 flex flex-col transition-colors duration-200">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 flex-none transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              {/* Brand */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(ViewState.STORES)}>
                <DevluLogo />
              </div>

              {/* Navigation Links */}
              {config.listStoresUrl && (
                <div className="hidden md:flex items-center gap-1">
                  <button
                    onClick={() => setView(ViewState.STORES)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === ViewState.STORES || view === ViewState.DOCUMENTS ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    FileStores
                  </button>
                  <button
                    onClick={() => setView(ViewState.CHAT)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === ViewState.CHAT ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <MessageSquareText size={16} />
                    Chat
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Mobile Chat Link */}
              {config.listStoresUrl && (
                <button
                  onClick={() => setView(ViewState.CHAT)}
                  className={`md:hidden p-2 rounded-full transition-all duration-200 ${view === ViewState.CHAT ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title="Chat"
                >
                  <MessageSquareText size={20} />
                </button>
              )}

              <button
                onClick={() => setView(ViewState.SETTINGS)}
                className={`p-2 rounded-full transition-all duration-200 ${view === ViewState.SETTINGS ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                title="Settings"
              >
                <SettingsIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col animate-fade-in overflow-hidden h-[calc(100vh-64px)]">
        {view === ViewState.SETTINGS && (
          <div className="overflow-auto py-8">
            <Settings
              currentConfig={config}
              onSave={handleSaveConfig}
              onCancel={config.listStoresUrl ? () => setView(ViewState.STORES) : undefined}
              isFirstRun={!config.listStoresUrl}
            />
          </div>
        )}

        {view === ViewState.STORES && (
          <div className="overflow-auto py-8">
            <FileStores
              config={config}
              onSelectStore={handleStoreSelect}
            />
          </div>
        )}

        {view === ViewState.DOCUMENTS && selectedStore && (
          <div className="overflow-auto py-0 h-full">
            <Documents
              config={config}
              store={selectedStore}
              onBack={goBackToStores}
            />
          </div>
        )}

        {view === ViewState.CHAT && (
          <div className="flex justify-center items-start w-full h-full">
            <Chat config={config} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;