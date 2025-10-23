import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	server: {
		port: 3001,
		host: 'localhost',
		open: false, // Don't auto-open browser
	},
	root: __dirname,
	esbuild: {
		target: 'esnext',
	},
	plugins: [],
	resolve: {
		alias: {
			// Point to the built web-ui package
			'@8f4e/web-ui': resolve(__dirname, '../dist'),
			'@8f4e/editor-state': resolve(__dirname, '../../../packages/editor-state/dist'),
			'@8f4e/sprite-generator': resolve(__dirname, '../../../packages/sprite-generator/dist'),
			glugglug: resolve(__dirname, '../../../packages/glugglug/dist'),
		},
	},
});
