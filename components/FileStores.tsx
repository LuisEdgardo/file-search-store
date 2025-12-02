import React, { useState, useEffect } from 'react';
import { AppConfig, FileStore } from '../types';
import { apiService } from '../services/api';
import { Folder, Plus, Trash2, ArrowRight, Loader2, Database, AlertTriangle, FileText, XCircle, File } from 'lucide-react';
import Modal from './Modal';

interface FileStoresProps {
  config: AppConfig;
  onSelectStore: (store: FileStore) => void;
}

const FileStores: React.FC<FileStoresProps> = ({ config, onSelectStore }) => {
  const [stores, setStores] = useState<FileStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Document Counts State
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});

  // Delete Modal State
  const [storeToDelete, setStoreToDelete] = useState<FileStore | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Validation State for Deletion
  const [isCheckingDocs, setIsCheckingDocs] = useState(false);
  const [docCount, setDocCount] = useState<number | null>(null); // null: unchecked, -1: error, >=0: count

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.listStores(config);
      setStores(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stores. Check your webhook configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Effect to fetch document counts once stores are loaded
  useEffect(() => {
    if (stores.length === 0) return;

    const fetchCounts = async () => {
      stores.forEach(async (store) => {
        // Prevent re-fetching if we're already loading this store's count
        if (loadingCounts[store.id]) return;

        setLoadingCounts(prev => ({ ...prev, [store.id]: true }));
        try {
          const docs = await apiService.listDocuments(config, store.id);
          setDocCounts(prev => ({ ...prev, [store.id]: docs.length }));
        } catch (error) {
          console.error(`Failed to fetch count for store ${store.id}`, error);
          // Optionally set to -1 to indicate error, or just leave as undefined
        } finally {
          setLoadingCounts(prev => ({ ...prev, [store.id]: false }));
        }
      });
    };

    fetchCounts();
  }, [stores, config]); // Re-run when stores list changes

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setActionLoading(true);
    try {
      await apiService.createStore(config, newStoreName);
      setNewStoreName('');
      setIsCreating(false);
      fetchStores();
    } catch (err: any) {
      alert(err.message || 'Failed to create store');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = async (e: React.MouseEvent, store: FileStore) => {
    e.stopPropagation();
    setStoreToDelete(store);
    setDeleteConfirmationText('');
    setDocCount(null);
    setIsCheckingDocs(true);

    try {
      // Check if store has documents before allowing delete
      const docs = await apiService.listDocuments(config, store.id);
      setDocCount(docs.length);
    } catch (err) {
      console.error('Failed to verify store contents:', err);
      setDocCount(-1); // Error state
    } finally {
      setIsCheckingDocs(false);
    }
  };

  const closeDeleteModal = () => {
    setStoreToDelete(null);
    setDeleteConfirmationText('');
    setIsDeleting(false);
    setDocCount(null);
  };

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    
    setIsDeleting(true);
    const idToDelete = storeToDelete.id;
    
    try {
      // Wait for API response before updating UI
      await apiService.deleteStore(config, idToDelete);
      
      // Success: Remove from state
      setStores(prev => prev.filter(s => s.id !== idToDelete));
      closeDeleteModal();
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(`Failed to delete store: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to display a cleaner ID (removing resource prefix if present)
  const formatId = (id: string) => {
    if (!id) return '';
    const parts = id.split('/');
    return parts.length > 1 ? parts[parts.length - 1] : id;
  };

  const getDisplayName = (store: FileStore) => store.displayName || store.name;

  if (loading && stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 dark:text-slate-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Loading FileStores...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your FileStores</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your knowledge bases and collections.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 font-medium"
        >
          <Plus size={18} />
          <span>New Store</span>
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 transition-colors">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">Store Name (Display Name)</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g., Marketing Assets"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !newStoreName.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/30 text-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {stores.length === 0 && !error ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-500">
            <Database size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white">No FileStores found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Get started by creating your first store.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => {
             const count = docCounts[store.id];
             const isLoadingCount = loadingCounts[store.id];

             return (
              <div
                key={store.id}
                onClick={() => onSelectStore(store)}
                className="group bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-indigo-100 dark:hover:border-slate-600 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Folder size={24} />
                    </div>
                    <button
                      onClick={(e) => openDeleteModal(e, store)}
                      className="p-2 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Store"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1 truncate pr-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                    {getDisplayName(store)}
                  </h3>
                  
                  {/* Tooltip for ID */}
                  <div className="text-[10px] text-slate-300 dark:text-slate-500 truncate" title={`ID: ${store.id}`}>
                    {formatId(store.id)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-600">
                     <File size={14} className="text-slate-400 dark:text-slate-500" />
                     {isLoadingCount ? (
                       <Loader2 size={12} className="animate-spin text-slate-300 dark:text-slate-500" />
                     ) : (
                       <span>{count !== undefined ? `${count} file${count !== 1 ? 's' : ''}` : '...'}</span>
                     )}
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    View Docs <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!storeToDelete} 
        onClose={closeDeleteModal}
        title={docCount && docCount > 0 ? "Cannot Delete FileStore" : "Delete FileStore"}
      >
        {isCheckingDocs ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-500 dark:text-slate-400">
            <Loader2 size={32} className="animate-spin mb-3 text-indigo-600 dark:text-indigo-400" />
            <p>Checking store contents...</p>
          </div>
        ) : docCount === -1 ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <div className="text-amber-500 shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Verification Failed</p>
                <p>Could not verify if this store contains documents. Please try again or check your connection.</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : docCount && docCount > 0 ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
              <div className="text-orange-500 shrink-0 mt-0.5">
                <XCircle size={20} />
              </div>
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-semibold mb-1">Store is not empty</p>
                <p>
                  This FileStore contains <span className="font-bold">{docCount} document{docCount !== 1 ? 's' : ''}</span>. 
                </p>
                <p className="mt-2">
                  To prevent accidental data loss, you must delete all documents inside <strong>{storeToDelete && getDisplayName(storeToDelete)}</strong> before you can delete the store itself.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <FileText size={18} />
                <span className="text-sm font-medium">Manage Documents</span>
              </div>
              <button
                onClick={() => {
                  if (storeToDelete) {
                    onSelectStore(storeToDelete);
                    closeDeleteModal();
                  }
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
              >
                Go to Docs <ArrowRight size={12} />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
              <div className="text-red-500 shrink-0 mt-0.5">
                <AlertTriangle size={20} />
              </div>
              <div className="text-sm text-red-700 dark:text-red-200">
                <p className="font-semibold mb-1">This action is irreversible.</p>
                <p>
                  Deleting <strong>{storeToDelete && getDisplayName(storeToDelete)}</strong> will permanently remove the FileStore.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">{storeToDelete && getDisplayName(storeToDelete)}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type the store name here"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-50 dark:focus:ring-red-900/20 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!storeToDelete || deleteConfirmationText !== getDisplayName(storeToDelete) || isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Delete Permanently
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FileStores;