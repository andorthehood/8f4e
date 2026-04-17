/**
 * Extracts the base identifier from a pointee max() expression.
 * Input:  max(*value)
 * Output: value
 */
export default function extractPointeeElementMaxBase(name: string): string {
	if (name.startsWith('max(*') && name.endsWith(')')) {
		return name.slice(5, -1);
	}
	return name;
}
