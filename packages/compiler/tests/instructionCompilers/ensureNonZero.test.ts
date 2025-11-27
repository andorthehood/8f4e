import { describe, it, expect, beforeEach } from 'vitest';

import { createMockASTLeaf, createMockContext } from './testUtils';

import istructions from '../../src/instructionCompilers/index';
import { ErrorCode } from '../../src/errors';

import type { AST, CompilationContext } from '../../src/types';

describe('ensureNonZero', () => {
	let context: CompilationContext;
	let ast: AST[number];

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('ensureNonZero');
	});

	it('', () => {
		context.stack.push({ isInteger: true });

		const { loopSegmentByteCode } = istructions.ensureNonZero(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(true);
		expect(context.stack[0].isNonZero).toBe(true);
	});

	it('', () => {
		context.stack.push({ isInteger: false, isSafeMemoryAddress: false });

		const { loopSegmentByteCode } = istructions.ensureNonZero(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(false);
		expect(context.stack[0].isNonZero).toBe(true);
	});

	it('', () => {
		expect(() => istructions.ensureNonZero(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});
});
