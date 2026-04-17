/**
 * Checks if a string uses the element min function-style syntax: min(name).
 */
export default function hasElementMinPrefix(name: string): boolean {
	return name.startsWith('min(') && name.endsWith(')');
}
