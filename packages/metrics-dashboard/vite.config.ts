import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');
const logsRoot = path.join(workspaceRoot, 'logs/bundle-sizes');
const trackedLogPaths = [
	'8f4e.json',
	'@8f4e/editor.json',
	'@8f4e/editor-state.json',
	'@8f4e/compiler.json',
	'@8f4e/web-ui.json',
];

export default defineConfig({
	plugins: [bundleSizeLogsPlugin()],
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
	server: {
		port: 3001,
	},
	preview: {
		port: 3001,
	},
});

function bundleSizeLogsPlugin(): Plugin {
	return {
		name: 'bundle-size-logs',
		configureServer(server) {
			server.middlewares.use(async (request, response, next) => {
				if (!request.url?.startsWith('/bundle-sizes/')) {
					next();
					return;
				}

				try {
					const url = new URL(request.url, 'http://localhost');
					const relativePath = decodeURIComponent(url.pathname.slice('/bundle-sizes/'.length));
					const filePath = getLogFilePath(relativePath);
					const content = await fs.readFile(filePath, 'utf8');

					response.statusCode = 200;
					response.setHeader('Content-Type', 'application/json; charset=utf-8');
					response.end(content);
				} catch (error) {
					if (isFileNotFoundError(error)) {
						response.statusCode = 404;
						response.end('Not found');
						return;
					}

					next(error);
				}
			});
		},
		async generateBundle() {
			for (const logPath of trackedLogPaths) {
				const content = await fs.readFile(getLogFilePath(logPath), 'utf8');
				this.emitFile({
					type: 'asset',
					fileName: `bundle-sizes/${logPath}`,
					source: content,
				});
			}
		},
	};
}

function isFileNotFoundError(error: unknown) {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function getLogFilePath(relativePath: string) {
	const filePath = path.resolve(logsRoot, relativePath);
	const relativeToLogsRoot = path.relative(logsRoot, filePath);

	if (relativeToLogsRoot.startsWith('..') || path.isAbsolute(relativeToLogsRoot)) {
		throw new Error(`Invalid bundle-size log path: ${relativePath}`);
	}

	return filePath;
}
