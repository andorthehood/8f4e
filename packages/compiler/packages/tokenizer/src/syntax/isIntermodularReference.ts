/**
 * Checks if a string matches the intermodular reference pattern.
 * Valid patterns:
 * - &module:memory (start address reference)
 * - module:memory& (end address reference)
 *
 * Enforces exactly one colon separator (module:memory only).
 * Rejects multi-separator forms (e.g., &module:path:to:memory).
 * Rejects patterns with spaces or double ampersands.
 */
export default function isIntermodularReference(value: string): boolean {
	// Match &<module>:<memory> (start) or <module>:<memory>& (end)
	// Module and memory names cannot contain colons, dots, spaces, or ampersands
	return /^(&[^\s&:.]+:[^\s&:.]+|[^\s&:.]+:[^\s&:.]+&)$/.test(value);
}
