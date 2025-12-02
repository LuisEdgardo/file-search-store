
import { AppConfig, FileStore, StoreDocument, ChatMessage } from '../types';

export const apiService = {
  // Helpers to validate if URL is valid
  isValidUrl: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  listStores: async (config: AppConfig): Promise<FileStore[]> => {
    if (!config.listStoresUrl) return [];
    
    try {
      const response = await fetch(config.listStoresUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stores: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // DEBUG: Mostrar respuesta cruda del webhook en consola
      console.log('📢 [Webhook 1 Response - List Stores]:', JSON.stringify(data, null, 2));
      
      // Handle User's specific structure: { fileSearchStores: [...] } (Direct object)
      if (data.fileSearchStores && Array.isArray(data.fileSearchStores)) {
        return data.fileSearchStores.map((store: any) => ({
          id: store.name, // The resource name is the unique identifier (e.g., fileSearchStores/...)
          name: store.displayName || store.name,
          createdAt: store.createTime,
          ...store
        }));
      }

      // Handle N8N wrapper structure: [{ fileSearchStores: [...] }] (Array wrapper)
      if (Array.isArray(data) && data.length > 0 && data[0].fileSearchStores) {
        return data[0].fileSearchStores.map((store: any) => ({
          id: store.name, 
          name: store.displayName || store.name,
          createdAt: store.createTime,
          ...store
        }));
      }

      // Handle standard N8N output (flat array or { data: [...] })
      const items = Array.isArray(data) ? data : (data.data || []);
      
      // Normalize data just in case
      return items.map((item: any) => ({
        ...item,
        id: item.id || item.name || Math.random().toString(36).substring(7),
        name: item.displayName || item.name || 'Untitled Store',
        createdAt: item.createTime || item.createdAt
      }));
    } catch (error: any) {
      console.error('❌ [Webhook 1 Error]:', error);
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
         // This is often a CORS error in browsers
         throw new Error('Network error: Unable to connect. Please check CORS settings on your webhook.');
      }
      throw error;
    }
  },

  createStore: async (config: AppConfig, name: string): Promise<void> => {
    const response = await fetch(config.createStoreUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameFileStore: name }),
    });
    if (!response.ok) throw new Error(`Failed to create store: ${response.statusText}`);
  },

  deleteStore: async (config: AppConfig, id: string): Promise<void> => {
    // id contains the resource name (e.g., fileSearchStores/xyz...)
    console.log(`🗑️ [Delete Store] Attempting to delete store with ID (name): ${id}`);
    console.log(`🔗 [Delete Store] URL: ${config.deleteStoreUrl}`);
    
    const response = await fetch(config.deleteStoreUrl, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: id }), // Sending 'name' as requested
    });

    // Attempt to read response text for debugging, even if successful
    const responseText = await response.text();
    console.log(`📢 [Delete Store Response]: Status ${response.status}`, responseText);

    if (!response.ok) {
        throw new Error(`Failed to delete store: ${response.status} ${response.statusText} - ${responseText}`);
    }
  },

  listDocuments: async (config: AppConfig, storeId: string): Promise<StoreDocument[]> => {
    if (!config.listDocsUrl) {
      console.error('❌ [List Docs] URL is missing configuration');
      throw new Error('List Documents URL is not configured');
    }

    console.log(`🚀 [List Docs] Calling webhook: ${config.listDocsUrl} for store: ${storeId}`);

    // Changed to POST to support sending body data as requested ("enviar campo name")
    const response = await fetch(config.listDocsUrl, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json' 
      },
      body: JSON.stringify({ name: storeId })
    });
    
    if (!response.ok) {
      console.error(`❌ [List Docs] Failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📢 [List Docs Response]:', data);
    
    // Normalize response: handle if n8n returns object with array or just array
    const rawDocs = Array.isArray(data) ? data : (data.documents || data.data || []);

    // Map the docs to ensure we catch the correct ID (resource name)
    return rawDocs.map((doc: any) => ({
      ...doc,
      // Priority for ID: existing id -> name (resource identifier)
      id: doc.id || doc.name, 
      // Priority for Display Name: displayName -> name (if not ID-like) -> fallback
      name: doc.displayName || doc.name || 'Untitled Document',
      size: doc.sizeBytes || doc.size, // Normalize size if needed
      mimeType: doc.mimeType
    }));
  },

  uploadDocument: async (config: AppConfig, storeId: string, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    // Changing 'storeId' to 'name' to be consistent with other endpoints where 'name' refers to the resource ID
    formData.append('name', storeId); 

    const response = await fetch(config.uploadDocUrl, {
      method: 'POST',
      // Content-Type is set automatically with boundary for FormData
      body: formData,
    });
    if (!response.ok) throw new Error(`Failed to upload document: ${response.statusText}`);
  },

  deleteDocument: async (config: AppConfig, storeId: string, docId: string): Promise<void> => {
    console.log(`🗑️ [Delete Doc] Deleting document: ${docId}`);
    
    const response = await fetch(config.deleteDocUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Updated: Send only 'name' with the document ID, as requested.
      body: JSON.stringify({ 
        name: docId 
      }), 
    });
    if (!response.ok) throw new Error(`Failed to delete document: ${response.statusText}`);
  },

  chatWithStore: async (config: AppConfig, storeId: string, question: string, history: ChatMessage[] = []): Promise<string> => {
    if (!config.chatDocUrl) throw new Error('Chat URL is not configured');

    const response = await fetch(config.chatDocUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: storeId,
        question: question,
        chatHistory: history.map(msg => ({ role: msg.role, content: msg.content }))
      })
    });

    if (!response.ok) throw new Error(`Chat request failed: ${response.statusText}`);

    const data = await response.json();
    
    // Attempt to find the answer in various common N8N output formats
    // 1. Direct object: { output: "answer" } or { text: "answer" }
    // 2. Array: [{ output: "answer" }]
    
    const content = Array.isArray(data) ? data[0] : data;
    
    return content.output || content.text || content.answer || content.message || JSON.stringify(content);
  }
};