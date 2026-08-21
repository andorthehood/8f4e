import { createEsLibConfig } from '@8f4e/config/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	...createEsLibConfig('./src/index.ts', 'dist'),
	build: {
		...createEsLibConfig('./src/index.ts', 'dist').build,
		emptyOutDir: false,
		rollupOptions: {
			...createEsLibConfig('./src/index.ts', 'dist').build?.rollupOptions,
			external: ['@8f4e/language-spec', '@8f4e/sub-program', '@8f4e/wasm-codegen'],
		},
	},
});
