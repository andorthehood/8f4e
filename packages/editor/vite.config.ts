import { defineConfig } from 'vite';
import { createUmdBundleConfig } from '@8f4e/config/vite';

export default defineConfig(
	createUmdBundleConfig({
		entry: './src/index.ts',
		name: 'Editor8f4e',
		outDir: 'bundle',
		fileName: 'editor-bundle.js',
	})
);
