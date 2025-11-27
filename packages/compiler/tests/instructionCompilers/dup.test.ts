import { describe, it, expect, beforeEach } from 'vitest';

import { createMockASTLeaf, createMockContext } from './testUtils';

import istructions from '../../src/instructionCompilers/index';
import { ErrorCode } from '../../src/errors';

import type { AST, CompilationContext } from '../../src/types';

describe('dup', () => {
	let context: CompilationContext;
	let ast: AST[number];

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('dup');
	});

	it('', () => {
		context.stack.push({ isInteger: true });

		const { loopSegmentByteCode } = istructions.dup(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(2);
		expect(context.stack[0].isInteger).toBe(true);
		expect(context.stack[1].isInteger).toBe(true);
	});

	it('', () => {
		context.stack.push({ isInteger: false });

		const { loopSegmentByteCode } = istructions.dup(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(2);
		expect(context.stack[0].isInteger).toBe(false);
		expect(context.stack[1].isInteger).toBe(false);
	});

	it('', () => {
		expect(() => istructions.dup(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});
});
