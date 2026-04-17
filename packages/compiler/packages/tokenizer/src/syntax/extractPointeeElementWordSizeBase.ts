/**
 * Extracts the base identifier from a pointee sizeof() expression.
 * Input:  sizeof(*value)
 * Output: value
 */
export default function extractPointeeElementWordSizeBase(name: string): string {
	if (name.startsWith('sizeof(*') && name.endsWith(')')) {
		return name.slice(8, -1);
	}
	return name;
}
