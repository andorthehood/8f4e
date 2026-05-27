/**
 * Extracts the base identifier from a memory pointer identifier by removing pointer prefixes.
 */
export default function extractMemoryPointerBase(name: string): string {
	return name.replace(/^\*+/, '');
}
