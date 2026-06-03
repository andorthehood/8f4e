import path from 'path';

import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
	plugins: [
		glsl({
			include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
			defaultExtension: 'glsl',
			warnDuplicatedImports: true,
		}),
	],
	build: {
		assetsInlineLimit: 0,
		emptyOutDir: true,
		lib: {
			entry: path.resolve(__dirname, 'src/webview/main.ts'),
			formats: ['es'],
			fileName: () => 'editor.js',
		},
		outDir: 'media/editor',
		rollupOptions: {
			output: {
				chunkFileNames: 'chunks/[name]-[hash].js',
				entryFileNames: 'editor.js',
			},
		},
		sourcemap: true,
		target: 'es2022',
	},
});
