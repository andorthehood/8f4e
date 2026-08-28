import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
	root: 'src',
	plugins: [
		viteStaticCopy({
			targets: [{ src: '_headers', dest: '' }],
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
	publicDir: false,
	server: {
		port: 3001,
		hmr: {
			port: 30001,
		},
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin',
		},
	},
}));
