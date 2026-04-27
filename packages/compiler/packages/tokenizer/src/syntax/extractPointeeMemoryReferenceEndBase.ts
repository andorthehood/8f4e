/**
 * Extracts the base identifier from a pointee end-address expression (*name&).
 * Input:  *name&
 * Output: name
 */
export default function extractPointeeMemoryReferenceEndBase(name: string): string {
	if (name.startsWith('*') && name.endsWith('&') && name.length > 2) {
		return name.slice(1, -1);
	}
	return name;
}
