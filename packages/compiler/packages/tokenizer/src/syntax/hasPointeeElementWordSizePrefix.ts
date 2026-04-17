/**
 * Checks if a string uses the pointee element word size function-style syntax: sizeof(*name).
 */
export default function hasPointeeElementWordSizePrefix(name: string): boolean {
	return name.startsWith('sizeof(*') && name.endsWith(')');
}
