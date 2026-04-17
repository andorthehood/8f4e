/**
 * Checks if a string has a memory pointer prefix (*).
 */
export default function isMemoryPointerIdentifier(name: string): boolean {
	return name.startsWith('*');
}
