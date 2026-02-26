import { CONFIG_WITH_TYPE_REGEX } from '../../../config-compiler/utils/extractConfigBody';

import type { CodeBlockType } from '~/types';

/**
 * Detects whether a block of code represents a shader, module, config, function, or unknown block by scanning for marker pairs.
 * @param code - Code block represented as an array of lines.
 * @returns The inferred code block type.
 */
export default function getBlockType(code: string[]): CodeBlockType {
	const hasModule = code.some(line => /^\s*module(\s|$)/.test(line));
	const hasModuleEnd = code.some(line => /^\s*moduleEnd(\s|$)/.test(line));
	const hasConfig = code.some(line => CONFIG_WITH_TYPE_REGEX.test(line));
	const hasConfigEnd = code.some(line => /^\s*configEnd(\s|$)/.test(line));
	const hasFunction = code.some(line => /^\s*function(\s|$)/.test(line));
	const hasFunctionEnd = code.some(line => /^\s*functionEnd(\s|$)/.test(line));
	const hasConstants = code.some(line => /^\s*constants(\s|$)/.test(line));
	const hasConstantsEnd = code.some(line => /^\s*constantsEnd(\s|$)/.test(line));
	const hasDefineMacro = code.some(line => /^\s*defineMacro(\s|$)/.test(line));
	const hasDefineMacroEnd = code.some(line => /^\s*defineMacroEnd(\s|$)/.test(line));
	const hasVertexShader = code.some(line => /^\s*vertexShader(\s|$)/.test(line));
	const hasVertexShaderEnd = code.some(line => /^\s*vertexShaderEnd(\s|$)/.test(line));
	const hasFragmentShader = code.some(line => /^\s*fragmentShader(\s|$)/.test(line));
	const hasFragmentShaderEnd = code.some(line => /^\s*fragmentShaderEnd(\s|$)/.test(line));

	if (
		hasModule &&
		hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
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
		!hasConstantsEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
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
		!hasConstantsEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
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
		!hasFunctionEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
	) {
		return 'constants';
	}

	if (
		hasDefineMacro &&
		hasDefineMacroEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
	) {
		return 'macro';
	}

	if (
		hasVertexShader &&
		hasVertexShaderEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasFragmentShader &&
		!hasFragmentShaderEnd
	) {
		return 'vertexShader';
	}

	if (
		hasFragmentShader &&
		hasFragmentShaderEnd &&
		!hasModule &&
		!hasModuleEnd &&
		!hasConfig &&
		!hasConfigEnd &&
		!hasFunction &&
		!hasFunctionEnd &&
		!hasConstants &&
		!hasConstantsEnd &&
		!hasDefineMacro &&
		!hasDefineMacroEnd &&
		!hasVertexShader &&
		!hasVertexShaderEnd
	) {
		return 'fragmentShader';
	}

	return 'unknown';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getBlockType', () => {
		it('detects module blocks', () => {
			expect(getBlockType(['module foo', 'moduleEnd'])).toBe('module');
		});

		it('detects config blocks', () => {
			expect(getBlockType(['config project', 'configEnd'])).toBe('config');
		});

		it('rejects config blocks without type', () => {
			expect(getBlockType(['config', 'configEnd'])).toBe('unknown');
		});

		it('detects function blocks', () => {
			expect(getBlockType(['function foo', 'functionEnd'])).toBe('function');
		});

		it('detects constants blocks', () => {
			expect(getBlockType(['constants', 'constantsEnd'])).toBe('constants');
		});

		it('detects macro blocks', () => {
			expect(getBlockType(['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'])).toBe('macro');
		});

		it('detects vertexShader blocks', () => {
			expect(getBlockType(['vertexShader crt', 'vertexShaderEnd'])).toBe('vertexShader');
		});

		it('detects fragmentShader blocks', () => {
			expect(getBlockType(['fragmentShader crt', 'fragmentShaderEnd'])).toBe('fragmentShader');
		});

		it('returns unknown for mixed markers', () => {
			expect(getBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
		});

		it('returns unknown for mixed shader and module markers', () => {
			expect(getBlockType(['module foo', 'vertexShaderEnd'])).toBe('unknown');
		});
	});
}
