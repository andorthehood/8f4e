import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	server: {
		port: 3002,
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
			// Point to the built sprite-generator package
			'@8f4e/sprite-generator': resolve(__dirname, '../dist'),
			glugglug: resolve(__dirname, '../../../packages/glugglug/dist'),
		},
	},
});
