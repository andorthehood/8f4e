/**
 * Extracts the module and memory identifiers from an inter-modular element min reference.
 * Example: "min(module:buffer)" -> { module: "module", memory: "buffer" }
 */
export default function extractIntermodularElementMinBase(value: string): { module: string; memory: string } {
	// Remove leading "min(" and trailing ")"
	const inner = value.slice(4, -1);
	const [module, memory] = inner.split(':');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementMinBase', () => {
		it('extracts module and memory from inter-modular element min reference', () => {
			expect(extractIntermodularElementMinBase('min(module:buffer)')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementMinBase('min(sourceModule:data)')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
