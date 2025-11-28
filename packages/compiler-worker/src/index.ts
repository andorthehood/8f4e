import { CompileOptions, Module } from '@8f4e/compiler';

import compileAndUpdateMemory from './compileAndUpdateMemory';

async function compile(modules: Module[], compilerOptions: CompileOptions) {
	try {
		const { codeBuffer, compiledModules, allocatedMemorySize, memoryRef } = await compileAndUpdateMemory(
			modules,
			compilerOptions
		);
		self.postMessage({
			type: 'success',
			payload: {
				codeBuffer,
				compiledModules,
				allocatedMemorySize,
				wasmMemory: memoryRef,
			},
		});
	} catch (error) {
		self.postMessage({
			type: 'compilationError',
			payload: error,
		});
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'compile':
			compile(event.data.payload.modules, event.data.payload.compilerOptions);
			break;
	}
};
