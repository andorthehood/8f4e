/**
 * Extracts the module and memory identifiers from an inter-modular element word size reference.
 * Input: %module.memory
 * Output: { module: 'module', memory: 'memory' }
 */
export default function extractIntermodularElementWordSizeBase(value: string): {
	module: string;
	memory: string;
} {
	// Remove leading %
	const cleaned = value.substring(1);
	const [module, memory] = cleaned.split('.');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementWordSizeBase', () => {
		it('extracts module and memory from element word size reference', () => {
			expect(extractIntermodularElementWordSizeBase('%module.buffer')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementWordSizeBase('%sourceModule.data')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
