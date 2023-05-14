import {
	createCodeSection,
	createExportSection,
	createFunctionBody,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from './wasmUtils/sectionHelpers';
import Type from './wasmUtils/type';
import { call, f32store, i32store } from './wasmUtils/instructionHelpers';
import { compile as compileModule, compileToAST } from './compiler';
import {
	CompiledModule,
	Module,
	CompiledModuleLookup,
	AST,
	Namespace,
	ArgumentLiteral,
	ArgumentType,
	CompileOptions,
	Namespaces,
} from './types';
import { calculateModuleWordSize } from './utils';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER, I32_SIGNED_LARGEST_NUMBER } from './consts';
import { ErrorCode, getError } from './errors';

export * from './types';
export { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
export * as examples from './examples';
export { Instruction } from './instructions';
export { default as instructions } from './instructions';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export function getInitialMemory(module: CompiledModule): number[] {
	return Array.from(module.memoryMap.values()).reduce((accumulator, current) => {
		if (Array.isArray(current.default)) {
			accumulator = accumulator.concat(current.default);
		} else {
			accumulator.push(current.default);
		}
		return accumulator;
	}, [] as number[]);
}

function collectConstants(ast: AST): Namespace['consts'] {
	return Object.fromEntries(
		ast
			.filter(({ instruction }) => instruction === 'const')
			.map(({ arguments: _arguments }) => {
				return [
					_arguments[0].value,
					{
						value: parseFloat(_arguments[1].value.toString()),
						isInteger: (_arguments[1] as ArgumentLiteral).isInteger,
					},
				];
			})
	);
}

function resolveInterModularConnections(compiledModules: CompiledModuleLookup) {
	compiledModules.forEach(({ ast, memoryMap }) => {
		ast.forEach(line => {
			const { instruction, arguments: _arguments } = line;
			if (
				['int*', 'float*'].includes(instruction) &&
				_arguments[0] &&
				_arguments[1] &&
				_arguments[0].type === ArgumentType.IDENTIFIER &&
				_arguments[1].type === ArgumentType.IDENTIFIER &&
				/(\S+)\.(\S+)/.test(_arguments[1].value)
			) {
				const [targetModuleId, targetMemoryId] = _arguments[1].value.split('.');

				const targetModule = compiledModules.get(targetModuleId);

				if (!targetModule) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const targetMemory = targetModule.memoryMap.get(targetMemoryId);

				if (!targetMemory) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
				}

				const memory = memoryMap.get(_arguments[0].value);

				if (memory) {
					memory.default = targetMemory.byteAddress;
				}
			}
		});
	});
}

export function compileModules(modules: Module[], options: CompileOptions): CompiledModule[] {
	let memoryAddress = options.startingMemoryWordAddress;
	const builtInConsts: Namespace['consts'] = {
		I16_SIGNED_LARGEST_NUMBER: { value: I16_SIGNED_LARGEST_NUMBER, isInteger: true },
		I16_SIGNED_SMALLEST_NUMBER: { value: I16_SIGNED_SMALLEST_NUMBER, isInteger: true },
		I32_SIGNED_LARGEST_NUMBER: { value: I32_SIGNED_LARGEST_NUMBER, isInteger: true },
		WORD_SIZE: { value: Int32Array.BYTES_PER_ELEMENT, isInteger: true },
		...options.constants,
	};

	const namespaces: Namespaces = new Map();

	const astModules = modules.map(({ code }) => {
		const ast = compileToAST(code);
		const moduleName = getModuleName(ast);
		namespaces.set(moduleName, { consts: collectConstants(ast) });
		return ast;
	});

	return astModules.map(ast => {
		const module = compileModule(ast, builtInConsts, namespaces, memoryAddress * Int32Array.BYTES_PER_ELEMENT);

		memoryAddress += calculateModuleWordSize(module);
		return module;
	});
}

export function getModuleName(ast: AST) {
	const moduleInstruction = ast.find(line => {
		return line.instruction === 'module';
	});

	if (!moduleInstruction) {
		throw 'Missing module instruction';
	}

	const argument = moduleInstruction.arguments[0];

	if (argument.type !== ArgumentType.IDENTIFIER) {
		throw 'Module instruction argument type invalid';
	}

	return argument.value;
}

export function generateMemoryInitiatorFunction(compiledModules: CompiledModule[]) {
	return compiledModules.flatMap(module => {
		let pointer = module.byteAddress;
		const instructions: number[] = [];

		Array.from(module.memoryMap.values()).forEach(memory => {
			if (Array.isArray(memory.default)) {
				memory.default.forEach(value => {
					instructions.push(...(memory.isInteger ? i32store(pointer, value) : f32store(pointer, value)));
					pointer += Int32Array.BYTES_PER_ELEMENT;
				});
			} else {
				instructions.push(
					...(memory.isInteger ? i32store(pointer, memory.default) : f32store(pointer, memory.default))
				);
				pointer += Int32Array.BYTES_PER_ELEMENT;
			}
		});

		return instructions;
	});
}

export default function compile(
	modules: Module[],
	options: CompileOptions
): {
	codeBuffer: Uint8Array;
	compiledModules: CompiledModuleLookup;
} {
	const compiledModules = compileModules(modules, { ...options, startingMemoryWordAddress: 1 });
	const compiledModulesMap = new Map(compiledModules.map(({ id, ...rest }) => [id, { id, ...rest }]));
	resolveInterModularConnections(compiledModulesMap);
	const functionBodies = compiledModules.map(({ functionBody }) => functionBody);
	const functionSignatures = compiledModules.map(() => 0x00);
	const cycleFunction = compiledModules.map((module, index) => call(index + 3)).flat();
	const memoryInitiatorFunction = generateMemoryInitiatorFunction(compiledModules);

	return {
		codeBuffer: Uint8Array.from([
			...HEADER,
			...VERSION,
			...createTypeSection([
				createFunctionType([], []),
				createFunctionType([Type.I32], [Type.I32]),
				createFunctionType([Type.I32, Type.I32], [Type.I32]),
			]),
			...createImportSection([createMemoryImport('js', 'memory', 1, 1, true)]),
			...createFunctionSection([0x00, 0x00, 0x00, ...functionSignatures]),
			...createExportSection([
				createFunctionExport('init', 0x00),
				createFunctionExport('cycle', 0x01),
				createFunctionExport('buffer', 0x02),
			]),
			...createCodeSection([
				createFunctionBody([], memoryInitiatorFunction),
				createFunctionBody([], cycleFunction),
				createFunctionBody([], new Array(128).fill(call(1)).flat()),
				...functionBodies,
			]),
		]),
		compiledModules: compiledModulesMap,
	};
}
