import { describe, it, expect, beforeEach } from 'vitest';

import { withValidation } from '../../src/withValidation';
import { ErrorCode } from '../../src/errors';
import { BLOCK_TYPE } from '../../src/types';

import type { AST, CompilationContext, InstructionCompiler } from '../../src/types';

function createMockContext(): CompilationContext {
	return {
		namespace: {
			locals: {},
			memory: {},
			consts: {},
			moduleName: '',
			namespaces: {},
		},
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
		stack: [],
		blockStack: [
			{
				hasExpectedResult: false,
				expectedResultIsInteger: false,
				blockType: BLOCK_TYPE.MODULE,
			},
		],
		startingByteAddress: 0,
		memoryByteSize: 0,
	};
}

function createMockASTLeaf(instruction: string): AST[number] {
	return {
		instruction: instruction as never,
		arguments: [],
		lineNumber: 0,
	};
}

describe('withValidation', () => {
	let context: CompilationContext;
	let ast: AST[number];
	let mockCompiler: InstructionCompiler;

	beforeEach(() => {
		context = createMockContext();
		ast = createMockASTLeaf('test');
		mockCompiler = (line, ctx) => {
			return ctx;
		};
	});

	describe('scope validation', () => {
		it('should pass when instruction is inside module with moduleOrFunction scope', () => {
			const compiler = withValidation({ scope: 'moduleOrFunction' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should pass when instruction is inside function with moduleOrFunction scope', () => {
			context.blockStack = [
				{
					hasExpectedResult: false,
					expectedResultIsInteger: false,
					blockType: BLOCK_TYPE.FUNCTION,
				},
			];
			const compiler = withValidation({ scope: 'moduleOrFunction' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when instruction is outside module with module scope', () => {
			context.blockStack = [];
			const compiler = withValidation({ scope: 'module' }, mockCompiler);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`);
		});

		it('should use custom error code for invalid scope', () => {
			context.blockStack = [];
			const compiler = withValidation(
				{
					scope: 'module',
					onInvalidScope: ErrorCode.MISSING_ARGUMENT,
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.MISSING_ARGUMENT}`);
		});

		it('should pass when instruction is inside init block with init scope', () => {
			context.blockStack = [
				{
					hasExpectedResult: false,
					expectedResultIsInteger: false,
					blockType: BLOCK_TYPE.INIT,
				},
			];
			const compiler = withValidation({ scope: 'init' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});
	});

	describe('operand count validation', () => {
		it('should pass when stack has sufficient operands', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: true });
			const compiler = withValidation({ minOperands: 2 }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when stack has insufficient operands', () => {
			context.stack.push({ isInteger: true });
			const compiler = withValidation({ minOperands: 2 }, mockCompiler);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
		});

		it('should use custom error code for insufficient operands', () => {
			const compiler = withValidation(
				{
					minOperands: 1,
					onInsufficientOperands: ErrorCode.MISSING_ARGUMENT,
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.MISSING_ARGUMENT}`);
		});

		it('should not mutate stack when operand count check fails', () => {
			context.stack.push({ isInteger: true });
			const compiler = withValidation({ minOperands: 2 }, mockCompiler);
			try {
				compiler(ast, context);
			} catch {
				// Expected to throw
			}
			expect(context.stack).toHaveLength(1);
		});

		it('should not mutate stack when type validation fails', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'int',
				},
				mockCompiler
			);
			try {
				compiler(ast, context);
			} catch {
				// Expected to throw
			}
			expect(context.stack).toHaveLength(2);
			expect(context.stack[0].isInteger).toBe(true);
			expect(context.stack[1].isInteger).toBe(false);
		});
	});

	describe('operand type validation - single rule', () => {
		it('should pass when all operands are integers with int rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: true });
			const compiler = withValidation({ minOperands: 2, operandTypes: 'int' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when operands are not all integers with int rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'int',
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.ONLY_INTEGERS}`);
		});

		it('should pass when all operands are floats with float rule', () => {
			context.stack.push({ isInteger: false });
			context.stack.push({ isInteger: false });
			const compiler = withValidation({ minOperands: 2, operandTypes: 'float' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when operands are not all floats with float rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'float',
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.ONLY_FLOATS}`);
		});

		it('should pass with any operand type when using any rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation({ minOperands: 2, operandTypes: 'any' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should pass when all operands match (integers) with matching rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: true });
			const compiler = withValidation({ minOperands: 2, operandTypes: 'matching' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should pass when all operands match (floats) with matching rule', () => {
			context.stack.push({ isInteger: false });
			context.stack.push({ isInteger: false });
			const compiler = withValidation({ minOperands: 2, operandTypes: 'matching' }, mockCompiler);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when operands do not match with matching rule', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'matching',
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.UNMATCHING_OPERANDS}`);
		});
	});

	describe('operand type validation - array rules', () => {
		it('should pass when operand types match array rules', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: ['int', 'float'],
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).not.toThrow();
		});

		it('should fail when first operand type does not match', () => {
			context.stack.push({ isInteger: false });
			context.stack.push({ isInteger: false });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: ['int', 'float'],
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.TYPE_MISMATCH}`);
		});

		it('should fail when second operand type does not match', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: true });
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: ['int', 'float'],
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.TYPE_MISMATCH}`);
		});
	});

	describe('combined validations', () => {
		it('should check scope before operand count', () => {
			context.blockStack = [];
			const compiler = withValidation(
				{
					scope: 'module',
					minOperands: 1,
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK}`);
		});

		it('should check operand count before operand types', () => {
			const compiler = withValidation(
				{
					minOperands: 2,
					operandTypes: 'int',
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).toThrow(`${ErrorCode.INSUFFICIENT_OPERANDS}`);
		});

		it('should pass all validations when everything is correct', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: true });
			const compiler = withValidation(
				{
					scope: 'moduleOrFunction',
					minOperands: 2,
					operandTypes: 'matching',
				},
				mockCompiler
			);
			expect(() => compiler(ast, context)).not.toThrow();
		});
	});

	describe('compiler delegation', () => {
		it('should call the wrapped compiler with correct arguments', () => {
			let calledLine: AST[number] | null = null;
			let calledContext: CompilationContext | null = null;

			const testCompiler: InstructionCompiler = (line, ctx) => {
				calledLine = line;
				calledContext = ctx;
				return ctx;
			};

			const compiler = withValidation({}, testCompiler);
			compiler(ast, context);

			expect(calledLine).toBe(ast);
			expect(calledContext).toBe(context);
		});

		it('should pass popped operands to the wrapped compiler correctly', () => {
			context.stack.push({ isInteger: true });
			context.stack.push({ isInteger: false });

			let stackAtCall: typeof context.stack = [];

			const testCompiler: InstructionCompiler = (line, ctx) => {
				stackAtCall = [...ctx.stack];
				return ctx;
			};

			const compiler = withValidation({ minOperands: 2 }, testCompiler);
			compiler(ast, context);

			expect(stackAtCall).toHaveLength(2);
			expect(stackAtCall[0].isInteger).toBe(true);
			expect(stackAtCall[1].isInteger).toBe(false);
		});
	});
});
