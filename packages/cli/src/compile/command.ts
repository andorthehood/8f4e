import { promises as fs } from 'fs';
import path from 'path';
import parse8f4eToProject from '../shared/parse8f4e';
import { compileProject } from './compileProject';

interface CompileCommandArgs {
	inputPath?: string;
	wasmOutputPath?: string;
}

function parseCompileArgs(args: string[]): CompileCommandArgs {
	let inputPath: string | undefined;
	let wasmOutputPath: string | undefined;

	for (let i = 0; i < args.length; i += 1) {
		const arg = args[i];
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

	return { inputPath, wasmOutputPath };
}

export function getCompileUsage(): string {
	return 'Usage: cli compile <input.8f4e> --wasm-output <output.wasm>';
}

export async function runCompileCommand(args: string[]): Promise<void> {
	const { inputPath, wasmOutputPath } = parseCompileArgs(args);

	if (!inputPath) {
		throw new Error(getCompileUsage());
	}

	if (!wasmOutputPath) {
		throw new Error(getCompileUsage());
	}

	const resolvedInput = path.resolve(process.cwd(), inputPath);
	const resolvedWasmOutput = path.resolve(process.cwd(), wasmOutputPath);

	if (path.extname(resolvedInput) !== '.8f4e') {
		throw new Error('Invalid input file: expected a .8f4e project file');
	}

	const inputRaw = await fs.readFile(resolvedInput, 'utf8');
	const project = parse8f4eToProject(inputRaw);

	const { compiledWasm } = await compileProject(project);

	await fs.mkdir(path.dirname(resolvedWasmOutput), { recursive: true });
	await fs.writeFile(resolvedWasmOutput, Buffer.from(compiledWasm, 'base64'));
}
