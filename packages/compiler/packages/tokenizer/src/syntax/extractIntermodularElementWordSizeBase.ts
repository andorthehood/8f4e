/**
 * Extracts the module and memory identifiers from an inter-modular element word size reference.
 * Input: sizeof(module:memory)
 * Output: { module: 'module', memory: 'memory' }
 */
export default function extractIntermodularElementWordSizeBase(value: string): {
	module: string;
	memory: string;
} {
	// Remove leading "sizeof(" and trailing ")"
	const inner = value.slice(7, -1);
	const [module, memory] = inner.split(':');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementWordSizeBase', () => {
		it('extracts module and memory from element word size reference', () => {
			expect(extractIntermodularElementWordSizeBase('sizeof(module:buffer)')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementWordSizeBase('sizeof(sourceModule:data)')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
