import { WASM_F64_SQRT } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import sqrt from './sqrt';

describe('sqrt instruction compiler', () => {
	it('emits F32_SQRT for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: true });

		analyzeAndCompileInstruction(
			sqrt,
			{
				lineNumber: 1,
				instruction: 'sqrt',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_SQRT for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: true });

		analyzeAndCompileInstruction(
			sqrt,
			{
				lineNumber: 1,
				instruction: 'sqrt',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'float64', isNonZero: false }]);
		expect(context.byteCode).toEqual([WASM_F64_SQRT]);
	});
});
