/**
 * Checks if a string has a memory reference as suffix (suffix&).
 */
export default function hasMemoryReferencePrefixEnd(name: string): boolean {
	return name.endsWith('&');
}
