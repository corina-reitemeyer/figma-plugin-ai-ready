import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  root: resolve(__dirname),
  server: {
    port: 5173,
    open: true,
    // Preview imports from ../src — watch the repo root so HMR picks up UI changes.
    watch: {
      ignored: ['!**/src/**']
    },
    fs: {
      allow: [resolve(__dirname, '..')]
    }
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
})
