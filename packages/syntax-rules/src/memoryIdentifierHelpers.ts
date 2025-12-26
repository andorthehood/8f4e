/**
 * Checks if a string has a memory reference prefix (&prefix) or suffix (suffix&)
 */
export function hasMemoryReferencePrefix(name: string): boolean {
	return name.startsWith('&') || name.endsWith('&');
}

/**
 * Checks if a string has a memory reference as prefix (&prefix)
 */
export function hasMemoryReferencePrefixStart(name: string): boolean {
	return name.startsWith('&');
}

/**
 * Checks if a string has a memory reference as suffix (suffix&)
 */
export function hasMemoryReferencePrefixEnd(name: string): boolean {
	return name.endsWith('&');
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
export function isMemoryPointerIdentifier(name: string): boolean {
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
 * Checks if a string matches the intermodular reference pattern (&module.identifier)
 */
export function isIntermodularReference(value: string): boolean {
	return /^&[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

/**
 * Parses pointer depth from an instruction string (e.g., "int**" returns 2)
 */
export function getPointerDepth(instruction: string): number {
	const matches = instruction.match(/\*+$/);
	return matches ? matches[0].length : 0;
}
