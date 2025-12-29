export type CodeBlockType = 'module' | 'config' | 'function' | 'unknown';

/**
 * Detects whether a block of code represents a module, config, function, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasConfig = code.some(line => /^\s*config(\s|$)/.test(line));
	const hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));
	const hasFunction = code.some(line => /^\s*function(\s|$)/.test(line));
	const hasFunctionEnd = code.some(line => /^\s*functionEnd(\s|$)/.test(line));

	if (hasModule && hasModuleEnd && !hasConfig && !hasConfigEnd && !hasFunction && !hasFunctionEnd) {
		return 'module';
	}

	if (hasConfig && hasConfigEnd && !hasModule && !hasModuleEnd && !hasFunction && !hasFunctionEnd) {
		return 'config';
	}

	if (hasFunction && hasFunctionEnd && !hasModule && !hasModuleEnd && !hasConfig && !hasConfigEnd) {
		return 'function';
	}

	return 'unknown';
}

/**
 * Extracts the identifier provided to the first module instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The module identifier or an empty string when none is found.
 */
export function getModuleId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}

/**
 * Extracts the identifier provided to the first function instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The function identifier or an empty string when none is found.
 */
export function getFunctionId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'function') {
			return args[0] || '';
		}
	}
	return '';
}
