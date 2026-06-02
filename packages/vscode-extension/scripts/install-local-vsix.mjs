import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { delimiter } from 'node:path';

const vsixPath = resolveVsixPath();
const cliPath = findVsCodeCli();

if (!cliPath) {
	console.error(
		[
			'Could not find the VS Code CLI.',
			'Install the "code" shell command from VS Code, or set VSCODE_CLI to the full CLI path.',
		].join('\n')
	);
	process.exit(127);
}

const result = spawnSync(cliPath, ['--install-extension', vsixPath, '--force'], {
	stdio: 'inherit',
});

if ((result.status ?? 1) !== 0) {
	process.exit(result.status ?? 1);
}

process.exit(0);

function resolveVsixPath() {
	if (process.env.VSIX_PATH) {
		return process.env.VSIX_PATH;
	}

	const distPath = 'dist';
	const vsixFiles = readdirSync(distPath)
		.filter(fileName => fileName.endsWith('.vsix'))
		.map(fileName => `${distPath}/${fileName}`)
		.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);

	if (vsixFiles.length === 0) {
		console.error('No VSIX package found in dist/. Run the package target before installing.');
		process.exit(1);
	}

	return vsixFiles[0];
}

function findVsCodeCli() {
	const candidates = [
		process.env.VSCODE_CLI,
		findOnPath('code'),
		'/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
		'/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code',
	].filter(Boolean);

	return candidates.find(candidate => existsSync(candidate)) ?? null;
}

function findOnPath(command) {
	for (const directory of (process.env.PATH ?? '').split(delimiter)) {
		const candidate = `${directory}/${command}`;
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}
