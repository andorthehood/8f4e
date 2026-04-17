/**
 * Extracts the module name and item index from an intermodular module nth-item reference.
 * Input must have already been validated by isIntermodularModuleNthReference.
 * Example: '&module:2' → { module: 'module', index: 2 }
 */
export default function extractIntermodularModuleNthReferenceBase(value: string): { module: string; index: number } {
	// value is like &module:0
	const withoutAmpersand = value.slice(1);
	const colonIdx = withoutAmpersand.indexOf(':');
	const module = withoutAmpersand.slice(0, colonIdx);
	const index = parseInt(withoutAmpersand.slice(colonIdx + 1), 10);
	return { module, index };
}
