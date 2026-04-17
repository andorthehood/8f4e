import { parseLine } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';

import castToFloat64 from './castToFloat64';

import createInstructionCompilerTestContext from '../utils/testUtils';

describe('castToFloat64 instruction compiler', () => {
	it('converts int operand to float64', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true });

		castToFloat64(parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('promotes float32 operand to float64', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isNonZero: true });

		castToFloat64(parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('is a no-op for float64 operand', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: false, isFloat64: true, isNonZero: true });

		castToFloat64(parseLine('castToFloat64', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});
});
