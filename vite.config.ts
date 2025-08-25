import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/components/ui": path.resolve(__dirname, "./src/components/ui"),
      "@/components/common": path.resolve(__dirname, "./src/components/common"),
      "@/components/features": path.resolve(__dirname, "./src/components/features"),
      "@/components/layout": path.resolve(__dirname, "./src/components/layout"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/types": path.resolve(__dirname, "./src/types/index.ts"),
      "@/config": path.resolve(__dirname, "./src/config/index.ts"),
      "@/constants": path.resolve(__dirname, "./src/constants/index.ts"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/test": path.resolve(__dirname, "./src/test"),
    },
  },
}));
