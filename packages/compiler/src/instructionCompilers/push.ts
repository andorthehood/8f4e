import { withValidation } from '../withValidation';
import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import f32const from '../wasmUtils/const/f32const';
import i32const from '../wasmUtils/const/i32const';
import f32load from '../wasmUtils/load/f32load';
import i32load from '../wasmUtils/load/i32load';
import localGet from '../wasmUtils/local/localGet';
import {
	getDataStructure,
	getDataStructureByteAddress,
	getMemoryStringLastByteAddress,
	getElementWordSize,
	getElementCount,
	getElementMaxValue,
	getElementMinValue,
} from '../utils/memoryData';
import {
	isMemoryIdentifier,
	isMemoryPointerIdentifier,
	isMemoryReferenceIdentifier,
	isElementCountIdentifier,
	isElementWordSizeIdentifier,
	isElementMaxIdentifier,
	isElementMinIdentifier,
} from '../utils/memoryIdentifier';
import { saveByteCode } from '../utils/compilation';
import extractElementCountBase from '../syntax/extractElementCountBase';
import extractElementWordSizeBase from '../syntax/extractElementWordSizeBase';
import extractElementMaxBase from '../syntax/extractElementMaxBase';
import extractElementMinBase from '../syntax/extractElementMinBase';
import extractMemoryPointerBase from '../syntax/extractMemoryPointerBase';
import extractMemoryReferenceBase from '../syntax/extractMemoryReferenceBase';
import hasMemoryReferencePrefixStart from '../syntax/hasMemoryReferencePrefixStart';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, ArgumentLiteral, InstructionCompiler, MemoryMap } from '../types';

function getTypeAppropriateConstInstruction(argument: ArgumentLiteral) {
	if (argument.isInteger) {
		return i32const(argument.value);
	} else {
		return f32const(argument.value);
	}
}

/**
 * Instruction compiler for `push`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const push: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const { locals, memory, consts } = context.namespace;

		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const argument = line.arguments[0];

		if (argument.type === ArgumentType.IDENTIFIER) {
			if (isMemoryIdentifier(memory, argument.value)) {
				const memoryItem = getDataStructure(memory, argument.value);

				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}

				context.stack.push({ isInteger: memoryItem.isInteger, isNonZero: false });

				return saveByteCode(context, [
					...i32const(memoryItem.byteAddress),
					...(memoryItem.isInteger ? i32load() : f32load()),
				]);
			} else if (isMemoryPointerIdentifier(memory, argument.value)) {
				const base = extractMemoryPointerBase(argument.value);
				const memoryItem = getDataStructure(memory, base);

				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}

				context.stack.push({ isInteger: memoryItem.isPointingToInteger, isNonZero: false });

				return saveByteCode(context, [
					...i32const(memoryItem.byteAddress),
					...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
					...(memoryItem.isPointingToInteger ? i32load() : f32load()),
				]);
			} else if (isMemoryReferenceIdentifier(memory, argument.value)) {
				const base = extractMemoryReferenceBase(argument.value);
				let value = 0;
				if (hasMemoryReferencePrefixStart(argument.value)) {
					value = getDataStructureByteAddress(memory, base);
				} else {
					value = getMemoryStringLastByteAddress(memory, base);
				}
				context.stack.push({ isInteger: true, isNonZero: value !== 0, isSafeMemoryAddress: true });
				return saveByteCode(context, i32const(value));
			} else if (isElementCountIdentifier(memory, argument.value)) {
				const base = extractElementCountBase(argument.value);
				context.stack.push({ isInteger: true, isNonZero: true });
				return saveByteCode(context, i32const(getElementCount(memory, base)));
			} else if (isElementWordSizeIdentifier(memory, argument.value)) {
				const base = extractElementWordSizeBase(argument.value);
				context.stack.push({ isInteger: true, isNonZero: true });
				return saveByteCode(context, i32const(getElementWordSize(memory, base)));
			} else if (isElementMaxIdentifier(memory, argument.value)) {
				const base = extractElementMaxBase(argument.value);
				const memoryItem = getDataStructure(memory, base);
				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}
				const maxValue = getElementMaxValue(memory, base);
				context.stack.push({ isInteger: memoryItem.isInteger, isNonZero: maxValue !== 0 });
				return saveByteCode(context, memoryItem.isInteger ? i32const(maxValue) : f32const(maxValue));
			} else if (isElementMinIdentifier(memory, argument.value)) {
				const base = extractElementMinBase(argument.value);
				const memoryItem = getDataStructure(memory, base);
				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}
				const minValue = getElementMinValue(memory, base);
				context.stack.push({ isInteger: memoryItem.isInteger, isNonZero: minValue !== 0 });
				return saveByteCode(context, memoryItem.isInteger ? i32const(minValue) : f32const(minValue));
			} else if (typeof consts[argument.value] !== 'undefined') {
				context.stack.push({
					isInteger: consts[argument.value].isInteger,
					isNonZero: consts[argument.value].value !== 0,
				});
				return saveByteCode(
					context,
					consts[argument.value].isInteger
						? i32const(consts[argument.value].value)
						: f32const(consts[argument.value].value)
				);
			} else {
				const local = locals[argument.value];

				if (!local) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}

				context.stack.push({ isInteger: local.isInteger, isNonZero: false });

				return saveByteCode(context, localGet(local.index));
			}
		} else {
			context.stack.push({ isInteger: argument.isInteger, isNonZero: argument.value !== 0 });

			return saveByteCode(context, getTypeAppropriateConstInstruction(argument));
		}
	}
);

export default push;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('push instruction compiler', () => {
		it('pushes a literal value', () => {
			const context = createInstructionCompilerTestContext();

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 5, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('pushes a constant value', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: {
						ANSWER: { value: 42, isInteger: true },
					},
				},
			});

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'ANSWER' }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				push({ lineNumber: 1, instruction: 'push', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		describe('element max prefix (^)', () => {
			it('pushes max value for int32', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt: {
								elementWordSize: 4,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '^myInt' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes max value for int16', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt16: {
								elementWordSize: 2,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '^myInt16' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes max value for int8', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt8: {
								elementWordSize: 1,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '^myInt8' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes max finite value for float32', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myFloat: {
								elementWordSize: 4,
								isInteger: false,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '^myFloat' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});
		});

		describe('element min prefix (!)', () => {
			it('pushes min value for int32', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt: {
								elementWordSize: 4,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '!myInt' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes min value for int16', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt16: {
								elementWordSize: 2,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '!myInt16' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes min value for int8', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt8: {
								elementWordSize: 1,
								isInteger: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '!myInt8' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});

			it('pushes lowest finite value for float32', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myFloat: {
								elementWordSize: 4,
								isInteger: false,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '!myFloat' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					loopSegmentByteCode: context.loopSegmentByteCode,
				}).toMatchSnapshot();
			});
		});
	});
}
