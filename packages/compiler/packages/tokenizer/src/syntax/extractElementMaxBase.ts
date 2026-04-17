/**
 * Extracts the base identifier from a max() expression.
 * Input:  max(value)
 * Output: value
 */
export default function extractElementMaxBase(name: string): string {
	if (name.startsWith('max(') && name.endsWith(')')) {
		return name.slice(4, -1);
	}
	return name;
}
