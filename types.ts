
export interface AppConfig {
  listStoresUrl: string;
  createStoreUrl: string;
  deleteStoreUrl: string;
  listDocsUrl: string;
  uploadDocUrl: string;
  deleteDocUrl: string;
  chatDocUrl: string;
}

export interface FileStore {
  id: string;
  name: string;
  createdAt?: string;
  description?: string;
  [key: string]: any; // Allow for flexible n8n responses
}

export interface StoreDocument {
  id: string;
  name: string;
  mimeType?: string;
  size?: number;
  url?: string;
  [key: string]: any; // Allow for flexible n8n responses
}

export enum ViewState {
  STORES = 'STORES',
  DOCUMENTS = 'DOCUMENTS',
  SETTINGS = 'SETTINGS',
  CHAT = 'CHAT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}