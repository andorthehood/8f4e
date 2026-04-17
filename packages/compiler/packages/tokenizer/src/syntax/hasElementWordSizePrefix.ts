/**
 * Checks if a string uses the element word size function-style syntax: sizeof(name).
 * Does not match the pointee form sizeof(*name).
 */
export default function hasElementWordSizePrefix(name: string): boolean {
	return name.startsWith('sizeof(') && name.endsWith(')') && !name.startsWith('sizeof(*');
}
