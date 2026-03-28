/**
 * Extracts the module and memory identifiers from an inter-modular element max reference.
 * Example: "max(module:buffer)" -> { module: "module", memory: "buffer" }
 */
export default function extractIntermodularElementMaxBase(value: string): { module: string; memory: string } {
	// Remove leading "max(" and trailing ")"
	const inner = value.slice(4, -1);
	const [module, memory] = inner.split(':');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementMaxBase', () => {
		it('extracts module and memory from inter-modular element max reference', () => {
			expect(extractIntermodularElementMaxBase('max(module:buffer)')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementMaxBase('max(sourceModule:data)')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
