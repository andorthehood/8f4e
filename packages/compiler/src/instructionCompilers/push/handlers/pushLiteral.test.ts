import { f64const, i32const } from '@8f4e/compiler-wasm-utils';
import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import pushLiteral from './pushLiteral';

import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { ArgumentLiteral } from '@8f4e/compiler-types';

describe('pushLiteral', () => {
	it('emits i32.const for integer literals and updates stack metadata', () => {
		const context = createInstructionCompilerTestContext();
		const literal: ArgumentLiteral = {
			type: ArgumentType.LITERAL,
			value: 7,
			isInteger: true,
		};

		pushLiteral(literal, context);

		expect(context.byteCode).toEqual(i32const(7));
		expect(context.stack).toEqual([{ isInteger: true, isNonZero: true, knownIntegerValue: 7 }]);
	});

	it('emits f64.const for float64 literals and tracks isFloat64', () => {
		const context = createInstructionCompilerTestContext();
		const literal: ArgumentLiteral = {
			type: ArgumentType.LITERAL,
			value: 1.5,
			isInteger: false,
			isFloat64: true,
		};

		pushLiteral(literal, context);

		expect(context.byteCode).toEqual(f64const(1.5));
		expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: true }]);
	});
});
