import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
	plugins: [
		legacy({
			targets: ['last 1 Chrome version']
		})
	],
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'src/index.html'),
				editor: resolve(__dirname, 'src/editor.html')
			},
			output: {
				assetFileNames: (assetInfo) => {
					if (assetInfo.name && assetInfo.name.endsWith('.html')) {
						return '[name][extname]';
					}
					return 'assets/[name]-[hash][extname]';
				}
			}
		},
		outDir: 'dist',
		commonjsOptions: {
			include: [/packages\/.*\/dist\/.*\.js$/],
		}
	},
	server: {
		port: 3000,
		hmr: {
			port: 30000
		},
		middlewareMode: false
	},
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
			res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			next();
		});
	},
	optimizeDeps: {
		include: [
			'@8f4e/2d-engine',
			'@8f4e/sprite-generator',
			'@8f4e/compiler',
			'@8f4e/editor',
			'@8f4e/audio-worklet-runtime',
			'@8f4e/compiler-worker',
			'@8f4e/web-worker-midi-runtime'
		]
	}
});