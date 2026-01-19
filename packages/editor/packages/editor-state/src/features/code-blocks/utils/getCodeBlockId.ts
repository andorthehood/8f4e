import { getModuleId, getFunctionId, getConstantsId } from '@8f4e/compiler/syntax';

import getVertexShaderId from '../../shader-effects/getVertexShaderId';
import getFragmentShaderId from '../../shader-effects/getFragmentShaderId';

/**
 * Retrieves the ID from a code block based on its type.
 * Tries to identify the code block as a module, function, constants, vertex shader, or fragment shader.
 *
 * @param code - Code block represented as an array of lines
 * @returns The ID of the code block, or an empty string if no ID is found
 */
export default function getCodeBlockId(code: string[]): string {
	return (
		getModuleId(code) ||
		getFunctionId(code) ||
		getConstantsId(code) ||
		getVertexShaderId(code) ||
		getFragmentShaderId(code) ||
		''
	);
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

		it('returns vertex shader ID for vertex shader blocks', () => {
			const code = ['vertexShader testVertex', '', 'vertexShaderEnd'];
			expect(getCodeBlockId(code)).toBe('testVertex');
		});

		it('returns fragment shader ID for fragment shader blocks', () => {
			const code = ['fragmentShader testFragment', '', 'fragmentShaderEnd'];
			expect(getCodeBlockId(code)).toBe('testFragment');
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
