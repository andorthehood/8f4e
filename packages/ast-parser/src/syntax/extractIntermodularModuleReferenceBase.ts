/**
 * Extracts the module identifier and direction from an intermodular module-base reference.
 * Inputs:
 * - &module:
 * - module:&
 */
export default function extractIntermodularModuleReferenceBase(value: string): {
	module: string;
	isEndAddress: boolean;
} {
	if (value.startsWith('&')) {
		return { module: value.slice(1, -1), isEndAddress: false };
	}

	return { module: value.slice(0, -2), isEndAddress: true };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractIntermodularModuleReferenceBase', () => {
		it('extracts the module identifier for start references', () => {
			expect(extractIntermodularModuleReferenceBase('&module:')).toEqual({ module: 'module', isEndAddress: false });
			expect(extractIntermodularModuleReferenceBase('&sourceModule:')).toEqual({
				module: 'sourceModule',
				isEndAddress: false,
			});
		});

		it('extracts the module identifier for end references', () => {
			expect(extractIntermodularModuleReferenceBase('module:&')).toEqual({ module: 'module', isEndAddress: true });
			expect(extractIntermodularModuleReferenceBase('sourceModule:&')).toEqual({
				module: 'sourceModule',
				isEndAddress: true,
			});
		});
	});
}
