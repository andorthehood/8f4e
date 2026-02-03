import { getModuleId, getFunctionId, getConstantsId } from '@8f4e/compiler/syntax';

/**
 * Retrieves the ID from a code block based on its type.
 * Tries to identify the code block as a module, function, or constants block.
 * Shader blocks (vertexShader / fragmentShader) do not carry IDs.
 *
 * @param code - Code block represented as an array of lines
 * @returns The ID of the code block, or an empty string if no ID is found
 */
export default function getCodeBlockId(code: string[]): string {
	return getModuleId(code) || getFunctionId(code) || getConstantsId(code) || '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockId', () => {
		it('returns module ID for module blocks', () => {
			const code = ['module testModule', '', 'moduleEnd'];
			expect(getCodeBlockId(code)).toBe('testModule');
		});

		it('returns function ID for function blocks', () => {
			const code = ['function testFunction', '', 'functionEnd'];
			expect(getCodeBlockId(code)).toBe('testFunction');
		});

		it('returns constants ID for constants blocks', () => {
			const code = ['constants env', '', 'constantsEnd'];
			expect(getCodeBlockId(code)).toBe('env');
		});

		it('returns empty string for shader blocks', () => {
			expect(getCodeBlockId(['vertexShader', '', 'vertexShaderEnd'])).toBe('');
			expect(getCodeBlockId(['fragmentShader', '', 'fragmentShaderEnd'])).toBe('');
		});

		it('returns empty string when no ID is found', () => {
			const code = ['some random code', 'without markers'];
			expect(getCodeBlockId(code)).toBe('');
		});

		it('prioritizes module ID over other types', () => {
			// This is an edge case - normally code wouldn't have multiple block types
			const code = ['module testModule', 'function testFunction', 'moduleEnd'];
			expect(getCodeBlockId(code)).toBe('testModule');
		});
	});
}
