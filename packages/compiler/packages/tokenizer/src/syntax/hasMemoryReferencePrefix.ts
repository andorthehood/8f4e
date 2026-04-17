/**
 * Checks if a string has a memory reference prefix (&prefix) or suffix (suffix&).
 */
export default function hasMemoryReferencePrefix(name: string): boolean {
	return name.startsWith('&') || name.endsWith('&');
}
