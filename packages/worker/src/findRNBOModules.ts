import { CompiledModuleLookup } from '@8f4e/compiler';

import { MaxModule } from './types';

export default function findMaxModules(compiledModules: CompiledModuleLookup): MaxModule[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('rnbo:'))
		.map(module => {
			const paramAdresses = [];

			for (const [, memory] of module.memoryMap) {
				if (memory.id.startsWith('param:')) {
					paramAdresses.push(memory.wordAddress);
				}
			}

			return {
				moduleId: module.id,
				paramAdresses,
			};
		});
}
