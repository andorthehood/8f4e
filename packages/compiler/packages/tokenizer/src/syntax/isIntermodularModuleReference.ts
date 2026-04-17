/**
 * Checks if a string matches the intermodular module-base reference pattern.
 * Valid pattern:
 * - &module: (start address of a module)
 * - module:& (end address of a module)
 *
 * Rejects local memory references like &buffer and intermodular memory references like &module:memory.
 */
export default function isIntermodularModuleReference(value: string): boolean {
	return /^(&[^\s&:.]+:|[^\s&:.]+:&)$/.test(value);
}
