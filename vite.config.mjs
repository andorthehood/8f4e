import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ command }) => {
  const resolvePath = (path) => resolve(__dirname, path)

  return {
    root: 'src',
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
            src: '_headers',
            dest: ''
          },
          {
            src: './cursor.png',
            dest: 'assets'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@8f4e/editor': resolvePath('packages/editor/dist'),
        '@8f4e/editor-state': resolvePath('packages/editor/packages/editor-state/dist'),
        '@8f4e/web-ui': resolvePath('packages/editor/packages/web-ui/dist'),
        'glugglug': resolvePath('packages/editor/packages/glugglug/dist'),
        '@8f4e/compiler': resolvePath('packages/compiler/dist'),
        '@8f4e/sprite-generator': resolvePath('packages/editor/packages/sprite-generator/dist'),
        '@8f4e/state-manager': resolvePath('packages/editor/packages/state-manager/dist'),
        '@8f4e/runtime-audio-worklet': resolvePath('packages/runtime-audio-worklet/dist'),
        '@8f4e/runtime-web-worker-logic': resolvePath('packages/runtime-web-worker-logic/dist'),
        '@8f4e/runtime-main-thread-logic': resolvePath('packages/runtime-main-thread-logic/dist'),
        '@8f4e/runtime-web-worker-midi': resolvePath('packages/runtime-web-worker-midi/dist')
      }
    },
    build: {
      outDir: '../dist',
      rollupOptions: {
        // Ensure proper module resolution for production
        external: []
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
  }
})
