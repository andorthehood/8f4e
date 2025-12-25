/**
 * Checks if a string has a memory reference prefix (&prefix) or suffix (suffix&)
 */
export function hasMemoryReferencePrefix(name: string): boolean {
	return name.startsWith('&') || name.endsWith('&');
}

/**
 * Extracts the base identifier from a memory reference identifier
 * Removes the & prefix or suffix
 */
export function extractMemoryReferenceBase(name: string): string {
	if (name.startsWith('&')) {
		return name.substring(1);
	}
	if (name.endsWith('&')) {
		return name.slice(0, -1);
	}
	return name;
}

/**
 * Checks if a string has a memory pointer prefix (*)
 */
export function hasMemoryPointerPrefix(name: string): boolean {
	return name.startsWith('*');
}

/**
 * Extracts the base identifier from a memory pointer identifier
 * Removes the * prefix
 */
export function extractMemoryPointerBase(name: string): string {
	return name.startsWith('*') ? name.substring(1) : name;
}

/**
 * Checks if a string has an element count prefix ($)
 */
export function hasElementCountPrefix(name: string): boolean {
	return name.startsWith('$');
}

/**
 * Extracts the base identifier from an element count identifier
 * Removes the $ prefix
 */
export function extractElementCountBase(name: string): string {
	return name.startsWith('$') ? name.substring(1) : name;
}

/**
 * Checks if a string has an element word size prefix (%)
 */
export function hasElementWordSizePrefix(name: string): boolean {
	return name.startsWith('%');
}

/**
 * Extracts the base identifier from an element word size identifier
 * Removes the % prefix
 */
export function extractElementWordSizeBase(name: string): string {
	return name.startsWith('%') ? name.substring(1) : name;
}

/**
 * Parses pointer depth from an instruction string (e.g., "int**" returns 2)
 */
export function getPointerDepth(instruction: string): number {
	const matches = instruction.match(/\*+$/);
	return matches ? matches[0].length : 0;
}
