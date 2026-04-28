import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');
const configPath = path.join(workspaceRoot, 'bundle-size.config.json');

type BundleSizeConfig = {
	outDir?: string;
	packages: Record<
		string,
		{
			label?: string;
			files: Array<{
				name: string;
			}>;
		}
	>;
};

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
					const config = await readBundleSizeConfig();
					const content =
						relativePath === 'manifest.json'
							? JSON.stringify(createManifest(config), null, '\t')
							: await fs.readFile(getLogFilePath(config, relativePath), 'utf8');

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
			const config = await readBundleSizeConfig();
			const manifest = createManifest(config);

			this.emitFile({
				type: 'asset',
				fileName: 'bundle-sizes/manifest.json',
				source: JSON.stringify(manifest, null, '\t'),
			});

			for (const log of manifest.logs) {
				const content = await fs.readFile(getLogFilePath(config, log.path), 'utf8');
				this.emitFile({
					type: 'asset',
					fileName: `bundle-sizes/${log.path}`,
					source: content,
				});
			}
		},
	};
}

function isFileNotFoundError(error: unknown) {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

async function readBundleSizeConfig(): Promise<BundleSizeConfig> {
	return JSON.parse(await fs.readFile(configPath, 'utf8')) as BundleSizeConfig;
}

function createManifest(config: BundleSizeConfig) {
	return {
		logs: Object.entries(config.packages).map(([packageName, packageConfig]) => ({
			packageName,
			label: packageConfig.label ?? packageName,
			path: getPackageLogRelativePath(packageName),
			files: packageConfig.files.map(file => file.name),
		})),
	};
}

function getLogFilePath(config: BundleSizeConfig, relativePath: string) {
	const logsRoot = path.resolve(workspaceRoot, config.outDir ?? 'logs/bundle-sizes');
	const filePath = path.resolve(logsRoot, relativePath);
	const relativeToLogsRoot = path.relative(logsRoot, filePath);

	if (relativeToLogsRoot.startsWith('..') || path.isAbsolute(relativeToLogsRoot)) {
		throw new Error(`Invalid bundle-size log path: ${relativePath}`);
	}

	return filePath;
}

function getPackageLogRelativePath(packageName: string) {
	const pathSegments = packageName.split('/');
	const fileName = `${pathSegments.pop()}.json`;
	return path
		.join(...pathSegments, fileName)
		.split(path.sep)
		.join('/');
}
