/**
 * Checks if a string matches the intermodular module nth-item reference pattern.
 * Valid patterns:
 * - &module:0 (address of the 0th memory item in a module)
 * - &module:1 (address of the 1st memory item in a module)
 * etc.
 *
 * Rejects named memory references like &module:buffer and module-base references like &module:.
 */
export default function isIntermodularModuleNthReference(value: string): boolean {
	return /^&[^\s&:.]+:[0-9]+$/.test(value);
}
