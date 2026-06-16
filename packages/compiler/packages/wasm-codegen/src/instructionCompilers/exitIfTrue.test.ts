import { WASM_DROP, WASM_END, WASM_IF, WASM_RETURN, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import exitIfTrue from './exitIfTrue';

describe('exitIfTrue instruction compiler', () => {
	it('emits a conditional early module exit and preserves the fallthrough stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			exitIfTrue,
			{
				lineNumber: 1,
				instruction: 'exitIfTrue',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toEqual([WASM_IF, WASM_TYPE_VOID, WASM_DROP, WASM_RETURN, WASM_END]);
		expect(context.stack).toEqual([{ kind: 'value', valueType: 'float', isNonZero: false }]);
	});
});
