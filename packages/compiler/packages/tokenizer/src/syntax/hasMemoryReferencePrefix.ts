/**
 * Checks if a string has a memory reference prefix (&prefix) or suffix (suffix&).
 *
 * @param name - Name to inspect.
 * @returns Whether the memory reference prefix condition is true.
 */
export default function hasMemoryReferencePrefix(name: string): boolean {
	return name.startsWith('&') || name.endsWith('&');
}
