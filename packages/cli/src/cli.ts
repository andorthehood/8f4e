#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from './compileProject';
import parse8f4eToProject from './shared/parse8f4e';
import traceInstructionFlow from './traceInstructionFlow';

import type { ProjectInput } from './shared/types';

function printUsage(): void {
	console.log('Usage: cli <input.8f4e> [--wasm-output <output.wasm>] [--trace-output <trace.json>]');
}

function parseArgs(args: string[]): {
	inputPath?: string;
	traceOutputPath?: string;
	wasmOutputPath?: string;
} {
	let inputPath: string | undefined;
	let traceOutputPath: string | undefined;
	let wasmOutputPath: string | undefined;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === '--trace-output') {
			traceOutputPath = args[i + 1];
			i += 1;
			continue;
		}
		if (arg === '--wasm-output') {
			wasmOutputPath = args[i + 1];
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

	return { inputPath, traceOutputPath, wasmOutputPath };
}

async function run(): Promise<void> {
	const { inputPath, traceOutputPath, wasmOutputPath } = parseArgs(process.argv.slice(2));

	if (!inputPath) {
		printUsage();
		process.exit(1);
	}

	if (!traceOutputPath && !wasmOutputPath) {
		printUsage();
		process.exit(1);
	}

	const resolvedInput = path.resolve(process.cwd(), inputPath);
	const resolvedTraceOutput = traceOutputPath ? path.resolve(process.cwd(), traceOutputPath) : undefined;
	const resolvedWasmOutput = wasmOutputPath ? path.resolve(process.cwd(), wasmOutputPath) : undefined;

	if (path.extname(resolvedInput) !== '.8f4e') {
		throw new Error('Invalid input file: expected a .8f4e project file');
	}

	const inputRaw = await fs.readFile(resolvedInput, 'utf8');
	const project = parse8f4eToProject(inputRaw) as ProjectInput;

	const { compilerOptions, compiledWasm } = compileProject(project);

	if (resolvedWasmOutput) {
		if (compiledWasm === undefined) {
			throw new Error('Unable to write WASM output: compiledWasm is missing from compiler output.');
		}

		await fs.mkdir(path.dirname(resolvedWasmOutput), { recursive: true });
		await fs.writeFile(resolvedWasmOutput, Buffer.from(compiledWasm, 'base64'));
	}

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
