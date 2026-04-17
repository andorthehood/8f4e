/**
 * Checks if a string uses the element count function-style syntax: count(name).
 */
export default function hasElementCountPrefix(name: string): boolean {
	return name.startsWith('count(') && name.endsWith(')');
}
