import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { delimiter } from 'node:path';

const vsixPath = 'dist/8f4e-vscode-extension-0.1.0.vsix';
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
