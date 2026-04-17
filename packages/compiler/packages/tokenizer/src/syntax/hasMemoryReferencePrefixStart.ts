/**
 * Checks if a string has a memory reference as prefix (&prefix).
 */
export default function hasMemoryReferencePrefixStart(name: string): boolean {
	return name.startsWith('&');
}
