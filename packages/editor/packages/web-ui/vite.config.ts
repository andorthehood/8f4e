import { defineConfig } from 'vite';
import { createLibConfig } from '@8f4e/config/vite';

export default defineConfig(
	createLibConfig({
		entry: './src/index.ts',
		outDir: 'dist',
		formats: ['es'],
		fileName: () => 'index.js',
		emptyOutDir: false,
		external: ['@8f4e/sprite-generator', 'glugglug'],
	})
);
