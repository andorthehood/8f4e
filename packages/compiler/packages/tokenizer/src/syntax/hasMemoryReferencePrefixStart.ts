/**
 * Checks if a string has a memory reference as prefix (&prefix).
 *
 * @param name - Name to inspect.
 * @returns Whether the memory reference prefix start condition is true.
 */
export default function hasMemoryReferencePrefixStart(name: string): boolean {
	return name.startsWith('&');
}
