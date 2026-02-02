#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from './compileProject';

import type { ProjectInput } from './shared/types';

function printUsage(): void {
	console.log('Usage: cli <input.json> -o <output.json>');
}

function parseArgs(args: string[]): { inputPath?: string; outputPath?: string } {
	let inputPath: string | undefined;
	let outputPath: string | undefined;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === '-o' || arg === '--output') {
			outputPath = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === '-h' || arg === '--help') {
			printUsage();
			process.exit(0);
		}
		if (!inputPath && !arg.startsWith('-')) {
			inputPath = arg;
		}
	}

	return { inputPath, outputPath };
}

async function run(): Promise<void> {
	const { inputPath, outputPath } = parseArgs(process.argv.slice(2));

	if (!inputPath || !outputPath) {
		printUsage();
		process.exit(1);
	}

	const resolvedInput = path.resolve(process.cwd(), inputPath);
	const resolvedOutput = path.resolve(process.cwd(), outputPath);

	const inputRaw = await fs.readFile(resolvedInput, 'utf8');
	const project = JSON.parse(inputRaw) as ProjectInput;

	if (!project || !Array.isArray(project.codeBlocks)) {
		throw new Error('Invalid project JSON: expected a top-level "codeBlocks" array');
	}

	const { outputProject } = compileProject(project);

	await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
	await fs.writeFile(resolvedOutput, JSON.stringify(outputProject, null, 2));
}

run().catch(error => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
