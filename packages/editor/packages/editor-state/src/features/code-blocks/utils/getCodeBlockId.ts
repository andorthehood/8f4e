import { getModuleId, getFunctionId, getConstantsId } from '@8f4e/tokenizer';

/**
 * Retrieves the ID from a code block based on its type.
 * Tries to identify the code block as a module, function, or constants block.
 * Note blocks do not carry IDs.
 *
 * @param code - Code block represented as an array of lines
 * @returns The ID of the code block, or an empty string if no ID is found
 */
export default function getCodeBlockId(code: string[]): string {
	const moduleId = getModuleId(code);
	if (moduleId) {
		return `module_${moduleId}`;
	}

	const functionId = getFunctionId(code);
	if (functionId) {
		return `function_${functionId}`;
	}

	const constantsId = getConstantsId(code);
	if (constantsId) {
		return `constants_${constantsId}`;
	}

	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockId', () => {
		it('returns module ID for module blocks', () => {
			const code = ['module testModule', '', 'moduleEnd'];
			expect(getCodeBlockId(code)).toBe('module_testModule');
		});

		it('returns function ID for function blocks', () => {
			const code = ['function testFunction', '', 'functionEnd'];
			expect(getCodeBlockId(code)).toBe('function_testFunction');
		});

		it('returns constants ID for constants blocks', () => {
			const code = ['constants env', '', 'constantsEnd'];
			expect(getCodeBlockId(code)).toBe('constants_env');
		});

		it('returns empty string for note blocks', () => {
			expect(getCodeBlockId(['note', '', 'noteEnd'])).toBe('');
			expect(getCodeBlockId(['note fragmentShaderPostprocess', '', 'noteEnd'])).toBe('');
		});

		it('returns empty string when no ID is found', () => {
			const code = ['some random code', 'without markers'];
			expect(getCodeBlockId(code)).toBe('');
		});

		it('prioritizes module ID over other types', () => {
			// This is an edge case - normally code wouldn't have multiple block types
			const code = ['module testModule', 'function testFunction', 'moduleEnd'];
			expect(getCodeBlockId(code)).toBe('module_testModule');
		});
	});
}
