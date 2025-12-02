/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_LIST_STORES_URL: string;
    readonly VITE_CREATE_STORE_URL: string;
    readonly VITE_DELETE_STORE_URL: string;
    readonly VITE_LIST_DOCS_URL: string;
    readonly VITE_UPLOAD_DOC_URL: string;
    readonly VITE_DELETE_DOC_URL: string;
    readonly VITE_CHAT_DOC_URL: string;
}

declare interface ImportMeta {
    readonly env: ImportMetaEnv;
}
