import { CompileOptions, Module } from '@8f4e/compiler';

import testBuild, { resetCompiledModulesCache } from './testBuild';

async function recompile(modules: Module[], compilerOptions: CompileOptions) {
	try {
		const { codeBuffer, compiledModules, allocatedMemorySize, memoryRef } = await testBuild(modules, compilerOptions);
		self.postMessage({
			type: 'buildOk',
			payload: {
				codeBuffer,
				compiledModules,
				allocatedMemorySize,
				wasmMemory: memoryRef,
			},
		});
	} catch (error) {
		self.postMessage({
			type: 'buildError',
			payload: error,
		});
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'recompile':
			recompile(event.data.payload.modules, event.data.payload.compilerOptions);
			break;
		case 'reset':
			resetCompiledModulesCache();
			break;
	}
};
