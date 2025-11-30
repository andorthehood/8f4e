/**
 * Shared utilities for the stack config compiler
 */

/** Regex to split path into segments (handles dot notation and array indices) */
export const PATH_SEGMENT_REGEX = /([^.[\]]+|\[\d+\])/g;

/**
 * Splits a path string into segments
 * Examples: "foo.bar" -> ["foo", "bar"]
 *           "foo[0].bar" -> ["foo", "[0]", "bar"]
 */
export function splitPathSegments(path: string): string[] {
	const segments = path.match(PATH_SEGMENT_REGEX) || [];
	return segments.filter(s => s.length > 0);
}
