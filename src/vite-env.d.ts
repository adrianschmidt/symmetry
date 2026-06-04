/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build label injected by the deploy workflows (prod: run number; PR: PR + run). */
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
