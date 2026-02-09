import { isDirective, parseDirective } from './syntax/parseDirective';
import { ErrorCode, getError } from './errors';
import type { AST } from './types';

export interface DirectiveMetadata {
	skipExecutionInCycle?: boolean;
}

/**
 * Extracts compiler directives from module code and validates them.
 * @param code - The module code lines.
 * @param blockType - The block type string ('module', 'function', 'constants').
 * @returns Directive metadata and any errors found.
 */
export function extractModuleDirectives(
	code: string[],
	blockType?: string
): { metadata: DirectiveMetadata; errors: Array<{ line: AST[number]; code: ErrorCode }> } {
	const metadata: DirectiveMetadata = {};
	const errors: Array<{ line: AST[number]; code: ErrorCode }> = [];

	// Determine if this is a module context
	const isModuleBlock = blockType === 'module' || code.some(line => /^\s*module\s/.test(line));
	const isFunctionBlock = blockType === 'function' || code.some(line => /^\s*function\s/.test(line));
	const isConstantsBlock = blockType === 'constants' || code.some(line => /^\s*constants\s/.test(line));

	code.forEach((line, lineNumber) => {
		if (!isDirective(line)) {
			return;
		}

		const directive = parseDirective(line);

		if (!directive) {
			return;
		}

		// Parse the directive
		switch (directive) {
			case 'skipExecution':
				// Check if we're in a valid context (module block only)
				if (isFunctionBlock || isConstantsBlock) {
					errors.push({
						line: {
							lineNumber,
							instruction: `#${directive}` as never,
							arguments: [],
						},
						code: ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT,
					});
				} else if (isModuleBlock) {
					// Set the flag (idempotent - duplicate directives are OK)
					metadata.skipExecutionInCycle = true;
				}
				break;
			default:
				// Unknown directive
				errors.push({
					line: {
						lineNumber,
						instruction: `#${directive}` as never,
						arguments: [],
					},
					code: ErrorCode.UNKNOWN_COMPILER_DIRECTIVE,
				});
				break;
		}
	});

	return { metadata, errors };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractModuleDirectives', () => {
		it('extracts skipExecution directive', () => {
			const code = ['module test', '#skipExecution', 'int value 0', 'moduleEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata.skipExecutionInCycle).toBe(true);
			expect(errors).toHaveLength(0);
		});

		it('accepts duplicate skipExecution directives (idempotent)', () => {
			const code = ['module test', '#skipExecution', '#skipExecution', 'int value 0', 'moduleEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata.skipExecutionInCycle).toBe(true);
			expect(errors).toHaveLength(0);
		});

		it('reports error for unknown directive', () => {
			const code = ['module test', '#unknownDirective', 'moduleEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata).toEqual({});
			expect(errors).toHaveLength(1);
			expect(errors[0].code).toBe(ErrorCode.UNKNOWN_COMPILER_DIRECTIVE);
		});

		it('reports error for module directive in function context', () => {
			const code = ['function test', '#skipExecution', 'functionEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata).toEqual({});
			expect(errors).toHaveLength(1);
			expect(errors[0].code).toBe(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT);
		});

		it('accepts directive in module context', () => {
			const code = ['module test', '#skipExecution', 'moduleEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata.skipExecutionInCycle).toBe(true);
			expect(errors).toHaveLength(0);
		});

		it('does not extract directive from constants block', () => {
			const code = ['constants env', '#skipExecution', 'constantsEnd'];
			const { metadata, errors } = extractModuleDirectives(code);

			expect(metadata).toEqual({});
			expect(errors).toHaveLength(1);
			expect(errors[0].code).toBe(ErrorCode.COMPILER_DIRECTIVE_INVALID_CONTEXT);
		});
	});
}
