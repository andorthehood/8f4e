/**
 * Checks if a string has the pointee end-address suffix form (*name&).
 * The string must start with '*', end with '&', and have at least one character
 * between the two sigils.
 */
export default function hasPointeeMemoryReferenceEndSuffix(name: string): boolean {
	return name.startsWith('*') && name.endsWith('&') && name.length > 2;
}
