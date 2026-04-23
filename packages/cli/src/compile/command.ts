import { promises as fs } from 'fs';
import path from 'path';

import { compileProject } from './compileProject';
import traceInstructionFlow from './traceInstructionFlow';

import parse8f4eToProject from '../shared/parse8f4e';

import type { ProjectInput } from '../shared/types';

interface CompileCommandArgs {
	inputPath?: string;
	traceOutputPath?: string;
	wasmOutputPath?: string;
}

function parseCompileArgs(args: string[]): CompileCommandArgs {
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
		if (!inputPath && !arg.startsWith('-')) {
			inputPath = arg;
			continue;
		}
		throw new Error(`Unknown compile argument: ${arg}`);
	}

	return { inputPath, traceOutputPath, wasmOutputPath };
}

export function getCompileUsage(): string {
	return 'Usage: cli compile <input.8f4e> [--wasm-output <output.wasm>] [--trace-output <trace.json>]';
}

export async function runCompileCommand(args: string[]): Promise<void> {
	const { inputPath, traceOutputPath, wasmOutputPath } = parseCompileArgs(args);

	if (!inputPath) {
		throw new Error(getCompileUsage());
	}

	if (!traceOutputPath && !wasmOutputPath) {
		throw new Error(getCompileUsage());
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
