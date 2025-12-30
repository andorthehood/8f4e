import { instructionParser } from './instructionParser';

export type CodeBlockType = 'module' | 'config' | 'function' | 'constants' | 'unknown';

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
	const hasConstants = code.some(line => /^\s*constants(\s|$)/.test(line));
	const hasConstantsEnd = code.some(line => /^\s*constantsEnd(\s|$)/.test(line));

	if (
		hasModule &&
		hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'module';
	}

	if (
		hasConfig &&
		hasConfigEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'config';
	}

	if (
		hasFunction &&
		hasFunctionEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasConstants &&
		!hasConstantsEnd
	) {
		return 'function';
	}

	if (
		hasConstants &&
		hasConstantsEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd
	) {
		return 'constants';
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
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
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
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'function') {
			return args[0] || '';
		}
	}
	return '';
}

/**
 * Extracts the identifier provided to the first constants instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The constants identifier or an empty string when none is found.
 */
export function getConstantsId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'constants') {
			return args[0] || '';
		}
	}
	return '';
}
