/**
 * Extracts the module and memory identifiers from an inter-modular element count reference.
 * Input: $module.memory
 * Output: { module: 'module', memory: 'memory' }
 */
export default function extractIntermodularElementCountBase(value: string): {
	module: string;
	memory: string;
} {
	// Remove leading $
	const cleaned = value.substring(1);
	const [module, memory] = cleaned.split('.');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementCountBase', () => {
		it('extracts module and memory from element count reference', () => {
			expect(extractIntermodularElementCountBase('$module.buffer')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementCountBase('$sourceModule.data')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
