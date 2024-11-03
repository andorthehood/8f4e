import { createMockASTLeaf, createMockContext } from './testUtils';

import istructions from '../../src/instructionCompilers/index';
import { AST, CompilationContext } from '../../src/types';
import { ErrorCode } from '../../src/errors';

describe('abs', () => {
	let context: CompilationContext;
	let ast: AST[number];

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('abs');
	});

	it('', () => {
		context.stack.push({ isInteger: true });

		const { loopSegmentByteCode } = istructions.abs(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(true);
	});

	it('', () => {
		context.stack.push({ isInteger: false, isSafeMemoryAddress: false });

		const { loopSegmentByteCode } = istructions.abs(ast, context);

		expect(loopSegmentByteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('', () => {
		expect(() => istructions.abs(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});
});
