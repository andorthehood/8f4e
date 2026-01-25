import compileProjectConfig from './config/compileProjectConfig';
import DEFAULT_PROJECT_CONFIG from './config/defaults';
import compileProjectModules from './program/compileProjectModules';

import type { CompileOptions } from '@8f4e/compiler';
import type { CompileProjectOptions, CompileProjectResult, ProjectInput } from './shared/types';

export function compileProject(project: ProjectInput, options: CompileProjectOptions = {}): CompileProjectResult {
	const includeConfig = options.includeConfig ?? true;
	const includeModules = options.includeModules ?? true;
	const includeWasm = options.includeWasm ?? true;
	const configType = options.configType ?? 'project';
	const defaultProjectConfig = options.defaultProjectConfig ?? DEFAULT_PROJECT_CONFIG;

	let compiledProjectConfig: Record<string, unknown> | undefined;
	let configSource = '';
	if (includeConfig) {
		const configResult = compileProjectConfig(project.codeBlocks, { configType, defaultProjectConfig });
		compiledProjectConfig = configResult.compiledProjectConfig;
		configSource = configResult.configSource;
	}

	const memorySizeBytes =
		options.compilerOptions?.memorySizeBytes ??
		(compiledProjectConfig?.memorySizeBytes as number | undefined) ??
		(defaultProjectConfig.memorySizeBytes as number);

	const compilerOptions: CompileOptions = {
		startingMemoryWordAddress: options.compilerOptions?.startingMemoryWordAddress ?? 0,
		memorySizeBytes,
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
	if (includeConfig && compiledProjectConfig) {
		outputProject.compiledProjectConfig = compiledProjectConfig;
	}
	if (includeModules && moduleResult.compiledModules !== undefined) {
		outputProject.compiledModules = moduleResult.compiledModules;
	}
	if (includeWasm && moduleResult.compiledWasm !== undefined) {
		outputProject.compiledWasm = moduleResult.compiledWasm;
	}

	return {
		outputProject,
		compiledProjectConfig,
		compilerOptions,
		compiledModules: moduleResult.compiledModules,
		compiledFunctions: undefined,
		compiledWasm: moduleResult.compiledWasm,
		allocatedMemorySize: moduleResult.allocatedMemorySize,
		configSource,
	};
}
