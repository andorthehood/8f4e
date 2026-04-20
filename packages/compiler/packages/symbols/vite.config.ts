import { defineConfig } from 'vite';
import { createEsLibConfig } from '@8f4e/config/vite';

export default defineConfig({
	...createEsLibConfig('./src/index.ts', 'dist'),
	build: {
		...createEsLibConfig('./src/index.ts', 'dist').build,
		emptyOutDir: false,
		rollupOptions: {
			...createEsLibConfig('./src/index.ts', 'dist').build?.rollupOptions,
			external: ['@8f4e/tokenizer'],
		},
	},
});
