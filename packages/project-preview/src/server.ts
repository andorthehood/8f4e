import { createReadStream, promises as fs } from 'node:fs';
import { createServer, type ServerResponse } from 'node:http';
import path from 'node:path';

const CONTENT_TYPES: Record<string, string> = {
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.map': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.wasm': 'application/wasm',
};

export interface PreviewServer {
	url: string;
	close: () => Promise<void>;
}

interface PreviewServerOptions {
	editorAssetsPath: string;
	projectPath: string;
}

function setIsolationHeaders(response: ServerResponse): void {
	response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
	response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
	response.setHeader('Cache-Control', 'no-store');
}

async function sendFile(response: ServerResponse, filePath: string): Promise<void> {
	const stat = await fs.stat(filePath);
	if (!stat.isFile()) {
		throw new Error('Not a file');
	}

	response.statusCode = 200;
	response.setHeader('Content-Type', CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream');
	response.setHeader('Content-Length', stat.size);
	createReadStream(filePath).pipe(response);
}

export async function startPreviewServer({
	editorAssetsPath,
	projectPath,
}: PreviewServerOptions): Promise<PreviewServer> {
	const assetsRoot = path.resolve(editorAssetsPath);
	const resolvedProjectPath = path.resolve(projectPath);
	const server = createServer(async (request, response) => {
		setIsolationHeaders(response);

		try {
			const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
			const pathname = decodeURIComponent(requestUrl.pathname);
			if (pathname === '/project.8f4e') {
				await sendFile(response, resolvedProjectPath);
				return;
			}

			const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
			const filePath = path.resolve(assetsRoot, relativePath);
			if (filePath !== assetsRoot && !filePath.startsWith(`${assetsRoot}${path.sep}`)) {
				response.statusCode = 403;
				response.end('Forbidden');
				return;
			}

			await sendFile(response, filePath);
		} catch {
			if (!response.headersSent) {
				response.statusCode = 404;
				response.setHeader('Content-Type', 'text/plain; charset=utf-8');
			}
			response.end('Not found');
		}
	});

	await new Promise<void>((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', () => {
			server.off('error', reject);
			resolve();
		});
	});

	const address = server.address();
	if (!address || typeof address === 'string') {
		await new Promise<void>(resolve => server.close(() => resolve()));
		throw new Error('Failed to determine preview server address');
	}

	return {
		url: `http://127.0.0.1:${address.port}`,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close(error => (error ? reject(error) : resolve()));
			}),
	};
}
