/**
 * Extracts the base identifier from a min() expression.
 * Input:  min(value)
 * Output: value
 */
export default function extractElementMinBase(name: string): string {
	if (name.startsWith('min(') && name.endsWith(')')) {
		return name.slice(4, -1);
	}
	return name;
}
