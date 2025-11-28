import { describe, it, expect, beforeEach } from 'vitest';

import { createMockContext, createMockASTLeaf } from './testUtils';

import istructions from '../../src/instructionCompilers/index';
import { ErrorCode } from '../../src/errors';

import type { AST, CompilationContext } from '../../src/types';

describe('loadFloat', () => {
	let context: CompilationContext;
	let ast: AST[number];

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('loadFloat');
	});

	it('', () => {
		context.stack.push({ isInteger: true, isSafeMemoryAddress: true });
		const { loopSegmentByteCode } = istructions.loadFloat(ast, context);
		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('', () => {
		context.stack.push({ isInteger: true, isSafeMemoryAddress: false });
		const { loopSegmentByteCode } = istructions.loadFloat(ast, context);
		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('', () => {
		context.stack.push({ isInteger: false });

		expect(() => istructions.loadFloat(ast, context)).toThrow(`${ErrorCode.ONLY_INTEGERS}`);
	});

	it('', () => {
		expect(() => istructions.loadFloat(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});
});
