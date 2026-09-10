/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the CyberKent API, e.g. https://api.cyberkent.example. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
