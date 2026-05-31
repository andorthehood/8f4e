import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => {
	return {
		root: 'src',
		define: {
			'import.meta.vitest': 'undefined',
		},
		plugins: [
			glsl({
				include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
				defaultExtension: 'glsl',
				warnDuplicatedImports: true,
				watch: true,
			}),
			viteStaticCopy({
				targets: [
					{
						src: '_headers',
						dest: '',
					},
					{
						src: '_redirects',
						dest: '',
					},
					{
						src: 'blocked.html',
						dest: '',
					},
				],
			}),
		],
		build: {
			outDir: '../dist',
			emptyOutDir: true,
			manifest: true,
			rollupOptions: {
				output: {
					entryFileNames: 'assets/entries/[name]-[hash].js',
					chunkFileNames: 'assets/chunks/[name]-[hash].js',
				},
			},
		},
		worker: {
			rollupOptions: {
				output: {
					entryFileNames: 'assets/workers/[name]-[hash].js',
					chunkFileNames: 'assets/workers/chunks/[name]-[hash].js',
				},
			},
		},
		publicDir: false, // Don't copy public dir since we need specific handling
		server: {
			port: 3000,
			hmr: {
				port: 30000,
			},
			headers: {
				'Cross-Origin-Embedder-Policy': 'require-corp',
				'Cross-Origin-Opener-Policy': 'same-origin',
			},
		},
	};
});
