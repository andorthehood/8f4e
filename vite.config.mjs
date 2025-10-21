import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'
  const resolvePath = (path) => resolve(__dirname, path)

  return {
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
            src: 'packages/editor/packages/web-ui/src/textures/cursor.png',
            dest: 'assets'
          }
        ]
      })
    ],
    resolve: {
      alias: {
        '@8f4e/editor': resolvePath(`packages/editor/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/web-ui': resolvePath(`packages/editor/packages/web-ui/${isBuild ? 'dist' : 'src'}`),
        'glugglug': resolvePath(`packages/editor/packages/glugglug/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/compiler': resolvePath(`packages/compiler/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/sprite-generator': resolvePath(`packages/editor/packages/sprite-generator/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/state-manager': resolvePath(
          `packages/editor/packages/state-manager/${isBuild ? 'dist' : 'src'}`
        ),
        '@8f4e/runtime-audio-worklet': resolvePath('packages/runtime-audio-worklet/dist'),
        '@8f4e/runtime-web-worker-logic': resolvePath(`packages/runtime-web-worker-logic/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/runtime-main-thread-logic': resolvePath(`packages/runtime-main-thread-logic/${isBuild ? 'dist' : 'src'}`),
        '@8f4e/runtime-web-worker-midi': resolvePath(`packages/runtime-web-worker-midi/${isBuild ? 'dist' : 'src'}`)
      }
    },
    build: {
      outDir: 'dist',
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
