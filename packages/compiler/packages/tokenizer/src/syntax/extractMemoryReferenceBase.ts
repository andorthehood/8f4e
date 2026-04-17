/**
 * Extracts the base identifier from a memory reference identifier by removing the & prefix or suffix.
 */
export default function extractMemoryReferenceBase(name: string): string {
	if (name.startsWith('&')) {
		return name.substring(1);
	}
	if (name.endsWith('&')) {
		return name.slice(0, -1);
	}
	return name;
}
