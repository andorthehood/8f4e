import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      defaultExtension: 'glsl',
      warnDuplicatedImports: true,
      watch: true
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/_headers',
          dest: ''
        },
        {
          src: 'packages/editor/src/view/textures/cursor.png',
          dest: 'assets'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@8f4e/editor': resolve(__dirname, 'packages/editor/dist'),
      '@8f4e/2d-engine': resolve(__dirname, 'packages/2d-engine/dist'),
      '@8f4e/compiler': resolve(__dirname, 'packages/compiler/dist'),
      '@8f4e/sprite-generator': resolve(__dirname, 'packages/sprite-generator/dist'),
      '@8f4e/audio-worklet-runtime': resolve(__dirname, 'packages/audio-worklet-runtime/dist'),
      '@8f4e/web-worker-logic-runtime': resolve(__dirname, 'packages/web-worker-logic-runtime/dist'),
      '@8f4e/web-worker-midi-runtime': resolve(__dirname, 'packages/web-worker-midi-runtime/dist')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Ensure proper module resolution for production
      external: [],
      output: {
        // Better chunking for production
        manualChunks: {
          'editor': ['@8f4e/editor'],
          'engine': ['@8f4e/2d-engine'],
          'compiler': ['@8f4e/compiler']
        }
      }
    }
  },
  publicDir: false, // Don't copy public dir since we need specific handling
  server: {
    port: 3000,
    hmr: {
      port: 30000
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    watch: {
      ignored: ['**/node_modules/**'],
      // Watch the built packages for changes
      followSymlinks: true
    }
  }
})