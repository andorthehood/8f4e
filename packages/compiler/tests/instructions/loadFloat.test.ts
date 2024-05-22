import { createMockContext, createMockASTLeaf } from './testUtils';

import istructions from '../../src/instructions/index';
import { AST, CompilationContext } from '../../src/types';
import { ErrorCode } from '../../src/errors';

describe('loadFloat', () => {
	let context: CompilationContext;
	let ast: AST[number];

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('loadFloat');
	});

	it('', () => {
		context.stack.push({ isInteger: true, isSafeMemoryAddress: true });
		const { byteCode } = istructions.loadFloat({ lineNumber: 0, instruction: 'loadFloat', arguments: [] }, context);
		expect(byteCode).toMatchSnapshot();
		expect(context.stack).toHaveLength(1);
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('', () => {
		context.stack.push({ isInteger: true, isSafeMemoryAddress: false });
		const { byteCode } = istructions.loadFloat({ lineNumber: 0, instruction: 'loadFloat', arguments: [] }, context);
		expect(byteCode).toMatchSnapshot();
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('', () => {
		context.stack.push({ isInteger: false });
		const ast: AST[number] = {
			lineNumber: 0,
			instruction: 'loadFloat',
			arguments: [],
		};
		expect(() => istructions.loadFloat(ast, context)).toThrow(`${ErrorCode.ONLY_INTEGERS}`);
	});

	it('', () => {
		const ast: AST[number] = {
			lineNumber: 0,
			instruction: 'loadFloat',
			arguments: [],
		};
		expect(() => istructions.loadFloat(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
	});
});
