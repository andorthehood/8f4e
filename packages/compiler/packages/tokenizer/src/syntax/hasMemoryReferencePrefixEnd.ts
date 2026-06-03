/**
 * Checks if a string has a memory reference as suffix (suffix&).
 *
 * @param name - Name to inspect.
 * @returns Whether the memory reference prefix end condition is true.
 */
export default function hasMemoryReferencePrefixEnd(name: string): boolean {
	return name.endsWith('&');
}
