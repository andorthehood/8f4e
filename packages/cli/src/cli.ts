#!/usr/bin/env node
import { getCompileUsage, runCompileCommand } from './compile/command';
import { getRunUsage, runRunCommand } from './run/command';

function getUsage(): string {
	return ['Usage:', `  ${getCompileUsage().replace('Usage: ', '')}`, `  ${getRunUsage().replace('Usage: ', '')}`].join(
		'\n'
	);
}

async function run(): Promise<void> {
	const [subcommand, ...args] = process.argv.slice(2);

	if (!subcommand || subcommand === '-h' || subcommand === '--help') {
		console.log(getUsage());
		process.exit(0);
	}

	if (subcommand === 'compile') {
		await runCompileCommand(args);
		return;
	}

	if (subcommand === 'run') {
		await runRunCommand(args);
		return;
	}

	throw new Error(`Unknown subcommand: ${subcommand}\n${getUsage()}`);
}

run().catch(error => {
	const message =
		error instanceof Error
			? error.message
			: typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
				? error.message
				: String(error);
	console.error(message);
	process.exit(1);
});
