import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    // visualizer(),
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
      '@8f4e/glugglug': resolve(__dirname, 'packages/glugglug/dist'),
      '@8f4e/compiler': resolve(__dirname, 'packages/compiler/dist'),
      '@8f4e/sprite-generator': resolve(__dirname, 'packages/sprite-generator/dist'),
      '@8f4e/runtime-audio-worklet': resolve(__dirname, 'packages/runtime-audio-worklet/dist'),
      '@8f4e/runtime-web-worker-logic': resolve(__dirname, 'packages/runtime-web-worker-logic/dist'),
      '@8f4e/runtime-main-thread-logic': resolve(__dirname, 'packages/runtime-main-thread-logic/dist'),
      '@8f4e/runtime-web-worker-midi': resolve(__dirname, 'packages/runtime-web-worker-midi/dist')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      // Ensure proper module resolution for production
      external: [],
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