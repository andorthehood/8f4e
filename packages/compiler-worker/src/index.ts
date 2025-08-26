import { CompileOptions, Module } from '@8f4e/compiler';

import testBuild from './testBuild';

console.log('DEBUG: compiler-worker loaded');

async function recompile(memoryRef: WebAssembly.Memory, modules: Module[], compilerOptions: CompileOptions) {
	try {
		const { codeBuffer, compiledModules, allocatedMemorySize } = await testBuild(memoryRef, modules, compilerOptions);
		self.postMessage({
			type: 'buildOk',
			payload: {
				codeBuffer,
				compiledModules,
				allocatedMemorySize,
			},
		});
	} catch (error) {
		console.log('buildError', error);
		self.postMessage({
			type: 'buildError',
			payload: error,
		});
	}
}

self.onmessage = function (event) {
	switch (event.data.type) {
		case 'recompile':
			recompile(event.data.payload.memoryRef, event.data.payload.modules, event.data.payload.compilerOptions);
			break;
	}
};
