import { parseLine } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../testUtils';
import castToFloat64 from './castToFloat64';

describe('castToFloat64 instruction compiler', () => {
	it('converts int operand to float64', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true });

		analyzeAndCompileInstruction(castToFloat64, parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('promotes float32 operand to float64', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float', isNonZero: true });

		analyzeAndCompileInstruction(castToFloat64, parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('is a no-op for float64 operand', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'float64', isNonZero: true });

		analyzeAndCompileInstruction(castToFloat64, parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
