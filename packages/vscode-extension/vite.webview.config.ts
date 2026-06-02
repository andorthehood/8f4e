import fs from 'node:fs';
import path from 'path';

import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

function audioWorkletAsset(): Plugin {
	return {
		name: '8f4e-audio-worklet-asset',
		generateBundle() {
			const sourcePath = path.resolve(__dirname, '..', 'runtime-audio-worklet', 'dist', 'worklet', 'index.js');
			const source = fs.readFileSync(sourcePath, 'utf8').replace(/\n?\/\/# sourceMappingURL=.*\s*$/, '');

			this.emitFile({
				type: 'asset',
				fileName: 'assets/audio-worklet.js',
				source,
			});
		},
	};
}

export default defineConfig({
	plugins: [
		glsl({
			include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
			defaultExtension: 'glsl',
			warnDuplicatedImports: true,
		}),
		audioWorkletAsset(),
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
