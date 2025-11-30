import type { CodeBlockType } from '../types';

export function getLastMemoryInstructionLine(code: string[]): number {
	// Find last index where the line matches the memory pattern
	return code.findLastIndex(line => /^\s*memory/.test(line));
}

export function getLongestLineLength(code: string[]): number {
	return code.reduce((longestLength, line) => (line.length > longestLength ? line.length : longestLength), 0);
}

export function getModuleId(code: string[]): string {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}

/**
 * Determines the type of a code block based on its content markers.
 *
 * @param code - Array of code lines
 * @returns 'module' if block contains module/moduleEnd markers (and no config markers)
 *          'config' if block contains config/configEnd markers (and no module markers)
 *          'unknown' otherwise (mixed, incomplete, or no recognizable markers)
 */
export function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasConfig = code.some(line => /^\s*config(\s|$)/.test(line));
	const hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));

	// Module block: has module/moduleEnd and no config markers
	if (hasModule && hasModuleEnd && !hasConfig && !hasConfigEnd) {
		return 'module';
	}

	// Config block: has config/configEnd and no module markers
	if (hasConfig && hasConfigEnd && !hasModule && !hasModuleEnd) {
		return 'config';
	}

	// Unknown: mixed, incomplete, or no recognizable markers
	return 'unknown';
}
