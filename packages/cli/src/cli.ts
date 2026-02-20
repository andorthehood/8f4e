#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from './compileProject';
import traceInstructionFlow from './traceInstructionFlow';

import type { ProjectInput } from './shared/types';

function printUsage(): void {
	console.log('Usage: cli <input.json> -o <output.json> [--trace-output <trace.json>]');
}

function parseArgs(args: string[]): { inputPath?: string; outputPath?: string; traceOutputPath?: string } {
	let inputPath: string | undefined;
	let outputPath: string | undefined;
	let traceOutputPath: string | undefined;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === '-o' || arg === '--output') {
			outputPath = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === '--trace-output') {
			traceOutputPath = args[i + 1];
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

	return { inputPath, outputPath, traceOutputPath };
}

async function run(): Promise<void> {
	const { inputPath, outputPath, traceOutputPath } = parseArgs(process.argv.slice(2));

	if (!inputPath || !outputPath) {
		printUsage();
		process.exit(1);
	}

	const resolvedInput = path.resolve(process.cwd(), inputPath);
	const resolvedOutput = path.resolve(process.cwd(), outputPath);
	const resolvedTraceOutput = traceOutputPath ? path.resolve(process.cwd(), traceOutputPath) : undefined;

	const inputRaw = await fs.readFile(resolvedInput, 'utf8');
	const project = JSON.parse(inputRaw) as ProjectInput;

	if (!project || !Array.isArray(project.codeBlocks)) {
		throw new Error('Invalid project JSON: expected a top-level "codeBlocks" array');
	}

	const { outputProject, compilerOptions } = compileProject(project);

	await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
	await fs.writeFile(resolvedOutput, JSON.stringify(outputProject, null, 2));

	if (resolvedTraceOutput) {
		if (!compilerOptions) {
			throw new Error('Unable to resolve compiler options for instruction flow tracing.');
		}

		const trace = traceInstructionFlow(project, compilerOptions);
		await fs.mkdir(path.dirname(resolvedTraceOutput), { recursive: true });
		await fs.writeFile(resolvedTraceOutput, JSON.stringify(trace, null, 2));
	}
}

run().catch(error => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(message);
	process.exit(1);
});
