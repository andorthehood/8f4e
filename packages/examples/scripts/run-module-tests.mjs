import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, '..');
const moduleRoot = resolve(packageRoot, 'src/modules');
const cliPath = resolve(packageRoot, '../cli/bin/cli.js');

function collectModulePaths(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = resolve(directory, entry.name);

		if (entry.isDirectory()) {
			return collectModulePaths(entryPath);
		}

		return entry.name.endsWith('.8f4em') ? [entryPath] : [];
	});
}

function hasTestModule(filePath) {
	return readFileSync(filePath, 'utf8')
		.split('\n')
		.some((line) => line.trim() === '#test');
}

const testModulePaths = collectModulePaths(moduleRoot).filter(hasTestModule).sort();

if (testModulePaths.length === 0) {
	console.log('No embedded example module tests found.');
	process.exit(0);
}

for (const modulePath of testModulePaths) {
	const displayPath = relative(packageRoot, modulePath).split(sep).join('/');
	console.log(`\n${displayPath}`);

	const result = spawnSync(process.execPath, [cliPath, 'test', modulePath], {
		cwd: packageRoot,
		stdio: 'inherit',
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

console.log(`\nRan embedded tests in ${testModulePaths.length} example module file(s).`);
