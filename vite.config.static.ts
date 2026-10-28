import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

function stubStartStoragePlugin(): Plugin {
  const stubCode = `
    export class AsyncLocalStorage {
      constructor() { this._store = undefined; }
      getStore() { return this._store; }
      run(store, fn) {
        const prev = this._store;
        this._store = store;
        try { return fn(); } finally { this._store = prev; }
      }
      enterWith(store) { this._store = store; }
      disable() { this._store = undefined; }
    }
    export function getStartContext(opts) { return undefined; }
    export function runWithStartContext(ctx, fn) { return fn(); }
    export default {
      AsyncLocalStorage,
      getStartContext,
      runWithStartContext,
    };
  `;

  return {
    name: "stub-start-storage-plugin",
    enforce: "pre",
    resolveId(id) {
      if (
        id === "node:async_hooks" ||
        id === "async_hooks" ||
        id === "@tanstack/start-storage-context" ||
        id.includes("start-storage-context")
      ) {
        return "\0virtual:start-storage-stub";
      }
      return null;
    },
    load(id) {
      if (
        id === "\0virtual:start-storage-stub" ||
        id.includes("start-storage-context") ||
        id.includes("async-local-storage")
      ) {
        return stubCode;
      }
      return null;
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    stubStartStoragePlugin(),
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "index.source.html"),
      },
    },
  },
});
