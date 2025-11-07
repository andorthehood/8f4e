import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { resolve } from 'path'
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ command }) => {
  const resolvePath = (path) => resolve(__dirname, path)
  const isDev = command === 'serve'

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
			'@8f4e/editor': resolvePath(isDev ? 'packages/editor/src/index.ts' : 'packages/editor/dist'),
			'@8f4e/editor-state': resolvePath(isDev ? 'packages/editor/packages/editor-state/src/index.ts' : 'packages/editor/packages/editor-state/dist'),
			'@8f4e/web-ui': resolvePath(isDev ? 'packages/editor/packages/web-ui/src/index.ts' : 'packages/editor/packages/web-ui/dist'),
			'glugglug': resolvePath(isDev ? 'packages/editor/packages/glugglug/src/index.ts' : 'packages/editor/packages/glugglug/dist'),
			'@8f4e/compiler': resolvePath(isDev ? 'packages/compiler/src/index.ts' : 'packages/compiler/dist'),
			'@8f4e/sprite-generator': resolvePath(isDev ? 'packages/editor/packages/sprite-generator/src/index.ts' : 'packages/editor/packages/sprite-generator/dist'),
			'@8f4e/state-manager': resolvePath(isDev ? 'packages/editor/packages/state-manager/src/index.ts' : 'packages/editor/packages/state-manager/dist'),
			'@8f4e/runtime-audio-worklet': resolvePath(isDev ? 'packages/runtime-audio-worklet/src/index.ts' : 'packages/runtime-audio-worklet/dist'),
			'@8f4e/runtime-web-worker-logic': resolvePath(isDev ? 'packages/runtime-web-worker-logic/src/index.ts' : 'packages/runtime-web-worker-logic/dist'),
			'@8f4e/runtime-main-thread-logic': resolvePath(isDev ? 'packages/runtime-main-thread-logic/src/index.ts' : 'packages/runtime-main-thread-logic/dist'),
			'@8f4e/runtime-web-worker-midi': resolvePath(isDev ? 'packages/runtime-web-worker-midi/src/index.ts' : 'packages/runtime-web-worker-midi/dist')
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
		}
	}
  }
})
