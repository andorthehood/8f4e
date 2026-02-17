import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl'
import { viteStaticCopy } from 'vite-plugin-static-copy'
// import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(() => {
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
		],
		build: {
			outDir: '../dist',
			rollupOptions: {
				// Ensure proper module resolution for production
				external: []
			}
		},
		publicDir: false, // Don't copy public dir since we need specific handling
		server: {
			port: 3001,
			hmr: {
				port: 30001
			},
			headers: {
				'Cross-Origin-Embedder-Policy': 'require-corp',
				'Cross-Origin-Opener-Policy': 'same-origin'
			}
		}
	}
})
