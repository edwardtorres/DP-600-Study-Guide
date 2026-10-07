/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import { serviceWorker } from './scripts/sw-plugin.ts'

/**
 * Puts the static first paint (src/shell.html, the loading header rendered from Header by
 * src/shell.test.tsx) inside #root, so the page paints before any script runs. React replaces it.
 */
function shellHtml(): Plugin {
  return {
    name: 'fabric-mill-shell',
    transformIndexHtml: (html) => html.replace('<div id="root"></div>', `<div id="root">${readFileSync('src/shell.html', 'utf8').trim()}</div>`),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), shellHtml(), serviceWorker()],
  build: {
    rolldownOptions: {
      output: {
        // Content is large and changes often; keeping it in its own chunks keeps every chunk under 500 kB
        // and lets the browser cache app code and content separately.
        codeSplitting: {
          groups: [
            { name: 'questions-prepare', test: /src[\\/]content[\\/]questions[\\/]prepare/ },
            { name: 'questions', test: /src[\\/]content[\\/]questions[\\/]/ },
            // Don't pull the puzzles' shared dependencies (machines, game state) into this
            // group, or the first load would have to fetch the puzzles chunk to get them.
            { name: 'puzzles', test: /src[\\/](content[\\/]puzzles|puzzles)[\\/]/, includeDependenciesRecursively: false },
            { name: 'labs', test: /src[\\/]content[\\/]labs[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Browser flows run with `npm run e2e` (Playwright), not here.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
})
