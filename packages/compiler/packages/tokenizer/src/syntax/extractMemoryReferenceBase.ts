/**
 * Extracts the base identifier from a memory reference identifier by removing the & prefix or suffix.
 *
 * @param name - Name to inspect.
 * @returns Extracted memory reference base.
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
