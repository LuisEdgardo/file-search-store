
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Save, AlertCircle, RotateCcw } from 'lucide-react';

interface SettingsProps {
  currentConfig: AppConfig;
  onSave: (config: AppConfig) => void;
  onCancel?: () => void;
  isFirstRun: boolean;
}

const Settings: React.FC<SettingsProps> = ({ currentConfig, onSave, onCancel, isFirstRun }) => {
  const [formData, setFormData] = useState<AppConfig>(currentConfig);
  const [errors, setErrors] = useState<Partial<Record<keyof AppConfig, string>>>({});

  const handleChange = (key: keyof AppConfig, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof AppConfig, string>> = {};
    let isValid = true;

    // Validate all keys except optional ones
    (Object.keys(formData) as Array<keyof AppConfig>).forEach(key => {
      // Optional fields
      if (key === 'chatDocUrl' && !formData[key]) return;

      if (!formData[key]) {
        newErrors[key] = 'URL is required';
        isValid = false;
      } else {
        const val = formData[key] || '';
        if (val.startsWith('/')) {
          // Allow relative paths for proxies
          return;
        }
        try {
          new URL(val);
        } catch {
          newErrors[key] = 'Invalid URL format';
          isValid = false;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
        <div className="mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white">Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Enter your N8N Webhook URLs and keys to connect your application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Store Management</h3>
              <InputGroup
                label="List Stores (GET)"
                value={formData.listStoresUrl}
                onChange={(v) => handleChange('listStoresUrl', v)}
                error={errors.listStoresUrl}
                placeholder="https://n8n.../list-stores"
              />
              <InputGroup
                label="Create Store (POST)"
                value={formData.createStoreUrl}
                onChange={(v) => handleChange('createStoreUrl', v)}
                error={errors.createStoreUrl}
                placeholder="https://n8n.../create-store"
              />
              <InputGroup
                label="Delete Store (POST)"
                value={formData.deleteStoreUrl}
                onChange={(v) => handleChange('deleteStoreUrl', v)}
                error={errors.deleteStoreUrl}
                placeholder="https://n8n.../delete-store"
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Document Management</h3>
              <InputGroup
                label="List Documents (POST)"
                value={formData.listDocsUrl}
                onChange={(v) => handleChange('listDocsUrl', v)}
                error={errors.listDocsUrl}
                placeholder="https://n8n.../list-docs"
              />
              <InputGroup
                label="Upload Document (POST)"
                value={formData.uploadDocUrl}
                onChange={(v) => handleChange('uploadDocUrl', v)}
                error={errors.uploadDocUrl}
                placeholder="https://n8n.../upload-doc"
              />
              <InputGroup
                label="Delete Document (POST)"
                value={formData.deleteDocUrl}
                onChange={(v) => handleChange('deleteDocUrl', v)}
                error={errors.deleteDocUrl}
                placeholder="https://n8n.../delete-doc"
              />
            </div>

            <div className="md:col-span-2 space-y-6 pt-4 border-t border-slate-50 dark:border-slate-700">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">AI Chat Integration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup
                  label="Chat with Store (POST)"
                  value={formData.chatDocUrl}
                  onChange={(v) => handleChange('chatDocUrl', v)}
                  error={errors.chatDocUrl}
                  placeholder="https://n8n.../chat-doc"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end items-center gap-3">
            {!isFirstRun && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to reset to default URLs? This will use the values defined in your environment variables.')) {
                  // We can't easily access process.env/DEFAULT_CONFIG here without passing it down,
                  // but we can just clear the form or reload. 
                  // Let's assume we want to trigger a reset in the parent.
                  // For now, I'll just reload the page or clear localStorage if I had access.
                  // BETTER: Request the parent to reset.
                  localStorage.removeItem('n8n_filestore_config');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              Reset to Defaults
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, error, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
}) => (
  <div className="group">
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 transition-colors group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400">
      {label}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2.5 rounded-lg border ${error ? 'border-red-300 dark:border-red-800 focus:ring-red-200 dark:focus:ring-red-900' : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-100 dark:focus:ring-indigo-900'} bg-slate-50 dark:bg-slate-700 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-4 transition-all duration-200 placeholder:text-slate-300 dark:placeholder:text-slate-500 text-sm text-slate-900 dark:text-white`}
      placeholder={placeholder}
    />
    {error && (
      <div className="flex items-center gap-1 mt-1.5 text-red-500 text-xs animate-pulse">
        <AlertCircle size={12} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

export default Settings;