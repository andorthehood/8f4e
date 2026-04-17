/**
 * Extracts the base identifier from a memory pointer identifier by removing the * prefix.
 */
export default function extractMemoryPointerBase(name: string): string {
	return name.startsWith('*') ? name.substring(1) : name;
}
