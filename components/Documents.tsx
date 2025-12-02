import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, FileStore, StoreDocument } from '../types';
import { apiService } from '../services/api';
import { ArrowLeft, FileText, UploadCloud, Trash2, File, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from './Modal';

interface DocumentsProps {
  config: AppConfig;
  store: FileStore;
  onBack: () => void;
}

const Documents: React.FC<DocumentsProps> = ({ config, store, onBack }) => {
  const [docs, setDocs] = useState<StoreDocument[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [docToDelete, setDocToDelete] = useState<StoreDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocs = async () => {
    if (!store.id) {
      console.error('Store ID is missing');
      return;
    }
    
    console.log('Fetching docs for store:', store.id);
    setLoading(true);
    try {
      const data = await apiService.listDocuments(config, store.id);
      setDocs(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load documents. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;
    
    setIsUploading(true);
    try {
      await apiService.uploadDocument(config, store.id, fileToUpload);
      await fetchDocs();
      closeUploadModal();
    } catch (err) {
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    setFileToUpload(null);
    setIsUploadModalOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openDeleteModal = (doc: StoreDocument) => {
    setDocToDelete(doc);
  };

  const closeDeleteModal = () => {
    setDocToDelete(null);
    setIsDeleting(false);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    
    setIsDeleting(true);
    const idToDelete = docToDelete.id;
    
    // Optimistic update
    const prevDocs = [...docs];
    setDocs(docs.filter(d => d.id !== idToDelete));
    closeDeleteModal();

    try {
      await apiService.deleteDocument(config, store.id, idToDelete);
    } catch (err) {
      setDocs(prevDocs); // Revert
      alert('Failed to delete document');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-500 font-normal">Store /</span>
              {store.name}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Managing documents in this container.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 font-medium"
          >
            <UploadCloud size={18} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col transition-colors">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
             <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
             <p>Loading documents...</p>
          </div>
        ) : docs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 transition-colors">
              <File size={32} className="text-slate-300 dark:text-slate-500" />
            </div>
            <p>No documents yet.</p>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium hover:underline"
            >
              Upload your first file
            </button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10 transition-colors">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-l-lg">Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Size</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {docs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px] md:max-w-md">
                          {doc.name || 'Untitled Document'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                        {doc.id ? doc.id.substring(0, 12) + '...' : 'No ID'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">
                      {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => openDeleteModal(doc)}
                        className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Upload Document"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${fileToUpload ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              id="file-upload"
            />
            
            <div className="flex flex-col items-center justify-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${fileToUpload ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
                {fileToUpload ? <CheckCircle size={24} /> : <UploadCloud size={24} />}
              </div>
              
              <div className="space-y-1">
                {fileToUpload ? (
                  <>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">{fileToUpload.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{(fileToUpload.size / 1024).toFixed(1)} KB ready to upload</p>
                    <button 
                      type="button" 
                      onClick={() => setFileToUpload(null)}
                      className="text-xs text-red-500 hover:underline mt-2"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <label htmlFor="file-upload" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer hover:underline">
                        Click to select
                      </label>
                      {' '}or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Any file type up to 10MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeUploadModal}
              disabled={isUploading}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileToUpload || isUploading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!docToDelete}
        onClose={closeDeleteModal}
        title="Delete Document"
      >
        <div className="space-y-4">
           <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
             <div className="text-red-500 shrink-0 mt-0.5">
               <AlertCircle size={20} />
             </div>
             <div className="text-sm text-red-700 dark:text-red-200">
               <p className="font-semibold mb-1">Confirm deletion</p>
               <p>Are you sure you want to delete <span className="font-medium text-red-900 dark:text-red-100">{docToDelete?.name}</span>?</p>
             </div>
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
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Documents;