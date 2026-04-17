/**
 * Extracts the base identifier from a sizeof() expression.
 * Input:  sizeof(value)
 * Output: value
 */
export default function extractElementWordSizeBase(name: string): string {
	if (name.startsWith('sizeof(') && name.endsWith(')')) {
		return name.slice(7, -1);
	}
	return name;
}
