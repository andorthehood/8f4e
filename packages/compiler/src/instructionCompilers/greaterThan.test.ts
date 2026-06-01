import type { CompilerASTLine } from '@8f4e/compiler-spec';
import { WASM_F64_GT } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import greaterThan from './greaterThan';

describe('greaterThan instruction compiler', () => {
	it('emits I32_GT_S for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			greaterThan,
			{
				lineNumber: 1,
				instruction: 'greaterThan',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F32_GT for float operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float', isNonZero: false },
			{ kind: 'value', valueType: 'float', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			greaterThan,
			{
				lineNumber: 1,
				instruction: 'greaterThan',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('emits F64_GT for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'float64', isNonZero: false },
			{ kind: 'value', valueType: 'float64', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			greaterThan,
			{
				lineNumber: 1,
				instruction: 'greaterThan',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
		expect(context.byteCode).toEqual([WASM_F64_GT]);
	});
});
