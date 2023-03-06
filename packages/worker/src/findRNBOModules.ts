import { CompiledModuleLookup } from '@8f4e/compiler';

import { RNBOModule } from './types';

export default function findMaxModules(compiledModules: CompiledModuleLookup): RNBOModule[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('rnbo:'))
		.map(module => {
			const paramAdresses: number[] = [];

			for (const [, memory] of module.memoryMap) {
				if (memory.id.startsWith('param:')) {
					paramAdresses.push(memory.wordAddress);
				}
			}

			return {
				patcherId: module.id.substring(5),
				paramAdresses,
			};
		});
}
