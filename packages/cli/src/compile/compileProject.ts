import compileProjectModules from './compileProjectModules';

import type { CompileOptions } from '@8f4e/compiler-types';
import type { CompileProjectOptions, CompileProjectResult, ProjectInput } from '../shared/types';

export function compileProject(project: ProjectInput, options: CompileProjectOptions = {}): CompileProjectResult {
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;

	const compilerOptions: CompileOptions = {
		startingMemoryWordAddress: options.compilerOptions?.startingMemoryWordAddress ?? 0,
		includeAST: options.compilerOptions?.includeAST,
		disableSharedMemory: options.compilerOptions?.disableSharedMemory,
		bufferSize: options.compilerOptions?.bufferSize,
		bufferStrategy: options.compilerOptions?.bufferStrategy,
	};

	const moduleResult = compileProjectModules(project.codeBlocks, {
		compilerOptions,
		includeModules,
		includeWasm,
	});

	const outputProject: Record<string, unknown> = { ...project };
	if (includeModules && moduleResult.compiledModules !== undefined) {
		outputProject.compiledModules = moduleResult.compiledModules;
	}
	if (includeWasm && moduleResult.compiledWasm !== undefined) {
		outputProject.compiledWasm = moduleResult.compiledWasm;
	}

	return {
		outputProject,
		compilerOptions,
		compiledModules: moduleResult.compiledModules,
		compiledFunctions: undefined,
		compiledWasm: moduleResult.compiledWasm,
		requiredMemoryBytes: moduleResult.requiredMemoryBytes,
	};
}
