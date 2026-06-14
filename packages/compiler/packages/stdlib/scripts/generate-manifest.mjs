import { readdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const stdRoot = path.join(packageRoot, 'std');
const manifestPath = path.join(packageRoot, 'manifest.json');

async function listStdlibFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async entry => {
			const fullPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return listStdlibFiles(fullPath);
			}
			return entry.isFile() && entry.name.endsWith('.8f4e') ? [fullPath] : [];
		})
	);

	return files.flat();
}

const includes = (await listStdlibFiles(stdRoot))
	.map(filePath => path.relative(packageRoot, filePath).split(path.sep).join('/'))
	.sort()
	.map(filePath => ({
		id: filePath.replace(/\.8f4e$/, ''),
		path: filePath,
	}));

await writeFile(manifestPath, `${JSON.stringify({ includes }, null, 2)}\n`);
