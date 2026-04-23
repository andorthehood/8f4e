import type { CompiledModuleLookup } from '@8f4e/compiler';
import type { MemoryLookup, ResolvedMemoryReference } from './types';

export function createMemoryLookup(compiledModules: CompiledModuleLookup): MemoryLookup {
	const qualified = new Map<string, ResolvedMemoryReference>();
	const byBareId = new Map<string, ResolvedMemoryReference | null>();

	for (const [moduleId, compiledModule] of Object.entries(compiledModules)) {
		for (const [memoryId, data] of Object.entries(compiledModule.memoryMap)) {
			const resolved: ResolvedMemoryReference = {
				key: `${moduleId}:${memoryId}`,
				moduleId,
				memoryId,
				data,
			};

			qualified.set(resolved.key, resolved);

			if (!byBareId.has(memoryId)) {
				byBareId.set(memoryId, resolved);
				continue;
			}

			byBareId.set(memoryId, null);
		}
	}

	return {
		resolve(id: string): ResolvedMemoryReference {
			const qualifiedMatch = qualified.get(id);
			if (qualifiedMatch) {
				return qualifiedMatch;
			}

			if (!byBareId.has(id)) {
				throw new Error(`Unknown memory id: ${id}`);
			}

			const bareMatch = byBareId.get(id);
			if (bareMatch) {
				return bareMatch;
			}

			const candidates = [...qualified.keys()].filter(key => key.endsWith(`:${id}`)).sort();
			throw new Error(`Ambiguous memory id: ${id}. Use one of: ${candidates.join(', ')}`);
		},
	};
}
