// Bundle entry point for compiler worker - exposes functions globally
import { CompileOptions, Module } from '@8f4e/compiler';

import testBuild from './testBuild';

export async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], compilerOptions: CompileOptions) {
	const { codeBuffer, compiledModules, allocatedMemorySize } = await testBuild(memoryRef, modules, compilerOptions);
	return {
		codeBuffer,
		compiledModules,
		allocatedMemorySize,
	};
}
