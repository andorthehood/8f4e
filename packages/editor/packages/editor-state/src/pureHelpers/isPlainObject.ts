/**
 * Type guard to check if a value is an object (not null or array)
 */
export default function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
