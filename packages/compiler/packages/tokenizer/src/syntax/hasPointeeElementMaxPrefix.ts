/**
 * Checks if a string uses the pointee element max function-style syntax: max(*name).
 */
export default function hasPointeeElementMaxPrefix(name: string): boolean {
	return name.startsWith('max(*') && name.endsWith(')');
}
