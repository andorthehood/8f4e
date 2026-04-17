/**
 * Tests if a string matches the intermodular reference pattern.
 * This regex is used for detecting inter-module references in AST arguments
 * during compilation and dependency sorting.
 *
 * Valid patterns:
 * - &module:memory (start address reference)
 * - module:memory& (end address reference)
 *
 * Enforces exactly one colon separator (module:memory only).
 */
const intermodularReferencePattern = /^(&[^\s&:.]+:[^\s&:.]+|[^\s&:.]+:[^\s&:.]+&)$/;

/**
 * Tests if a string matches the intermodular reference pattern.
 */
export default function isIntermodularReferencePattern(value: string): boolean {
	return intermodularReferencePattern.test(value);
}
