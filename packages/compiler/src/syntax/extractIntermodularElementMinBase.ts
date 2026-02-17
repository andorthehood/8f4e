/**
 * Extracts the module and memory identifiers from an inter-modular element min reference.
 * Example: "!module.buffer" -> { module: "module", memory: "buffer" }
 */
export default function extractIntermodularElementMinBase(value: string): { module: string; memory: string } {
	// Remove the leading ! prefix
	const withoutPrefix = value.substring(1);
	// Split on the dot to get module and memory
	const [module, memory] = withoutPrefix.split('.');
	return { module, memory };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularElementMinBase', () => {
		it('extracts module and memory from inter-modular element min reference', () => {
			expect(extractIntermodularElementMinBase('!module.buffer')).toEqual({
				module: 'module',
				memory: 'buffer',
			});
			expect(extractIntermodularElementMinBase('!sourceModule.data')).toEqual({
				module: 'sourceModule',
				memory: 'data',
			});
		});
	});
}
