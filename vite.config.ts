import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Added explicit import for process to fix TypeScript error regarding cwd()
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Use the imported process to safely call cwd() which resolves the type error on line 8
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This injects the API_KEY into the code where process.env.API_KEY is used
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      port: 3000,
      host: true
    }
  };
});
