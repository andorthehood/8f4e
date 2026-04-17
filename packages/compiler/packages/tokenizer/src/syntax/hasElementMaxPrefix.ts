/**
 * Checks if a string uses the element max function-style syntax: max(name).
 * Does not match the pointee form max(*name).
 */
export default function hasElementMaxPrefix(name: string): boolean {
	return name.startsWith('max(') && name.endsWith(')') && !name.startsWith('max(*');
}
