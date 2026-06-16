import { f32const, f64const, WASM_F32_EQ, WASM_F64_EQ, WASM_I32_EQZ } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import equalToZero from './equalToZero';

describe('equalToZero instruction compiler', () => {
	it('emits I32_EQZ for integer operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		analyzeAndCompileInstruction(
			equalToZero,
			{
				lineNumber: 1,
				instruction: 'equalToZero',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
		expect(context.byteCode).toEqual([WASM_I32_EQZ]);
	});

	it('emits F32_EQ for float32 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: false });

		analyzeAndCompileInstruction(
			equalToZero,
			{
				lineNumber: 1,
				instruction: 'equalToZero',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
		expect(context.byteCode).toEqual([...f32const(0), WASM_F32_EQ]);
	});

	it('emits F64_EQ for float64 operands', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: false });

		analyzeAndCompileInstruction(
			equalToZero,
			{
				lineNumber: 1,
				instruction: 'equalToZero',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([{ kind: 'value', valueType: 'int', isNonZero: false }]);
		expect(context.byteCode).toEqual([...f64const(0), WASM_F64_EQ]);
	});
});
