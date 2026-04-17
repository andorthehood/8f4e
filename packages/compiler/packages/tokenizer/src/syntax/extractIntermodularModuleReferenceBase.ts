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
