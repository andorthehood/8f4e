import { createEsLibConfig } from '@8f4e/config/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	...createEsLibConfig('./src/index.ts', 'dist'),
	build: {
		...createEsLibConfig('./src/index.ts', 'dist').build,
		emptyOutDir: false,
		rollupOptions: {
			...createEsLibConfig('./src/index.ts', 'dist').build?.rollupOptions,
			external: [
				'@8f4e/tokenizer',
				'@8f4e/language-spec',
				'@8f4e/memory-default-resolver',
				'@8f4e/memory-reference-inliner',
				'@8f4e/memory-planner',
				'@8f4e/stack-analyzer',
				'@8f4e/compiler-wasm-utils',
			],
		},
	},
});
