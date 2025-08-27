// Bundle entry point for compiler worker - makes worker code available
// Import the worker implementation to ensure it's included in the bundle
import { CompileOptions, Module } from '@8f4e/compiler';

import testBuild from './testBuild';

// Make sure the imports are not tree-shaken by using them
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
		console.log('testBuildError', error);
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

// Ensure this module is not tree-shaken away
console.log('8f4e compiler worker loaded');
