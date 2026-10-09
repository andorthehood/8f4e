import { WASM_DROP, WASM_END, WASM_IF, WASM_RETURN, WASM_TYPE_VOID } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { compileInstructionForTest, createStackFacts } from '../testUtils';
import exitIfTrue from './exitIfTrue';

describe('exitIfTrue instruction compiler', () => {
	it('emits a conditional early module exit and preserves the fallthrough stack', () => {
		const context = createInstructionCompilerTestContext();

		compileInstructionForTest(
			exitIfTrue,
			{
				lineNumber: 1,
				instruction: 'exitIfTrue',
				arguments: [],
			} as CompilerASTLine,
			context,
			createStackFacts({ droppedStackItems: [{ kind: 'value', valueType: 'float', isNonZero: false }] })
		);

		expect(context.byteCode).toEqual([WASM_IF, WASM_TYPE_VOID, WASM_DROP, WASM_RETURN, WASM_END]);
	});
});
