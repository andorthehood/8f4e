import pushConst from './push/handlers/pushConst';
import pushElementCount from './push/handlers/pushElementCount';
import pushElementMax from './push/handlers/pushElementMax';
import pushElementMin from './push/handlers/pushElementMin';
import pushElementWordSize from './push/handlers/pushElementWordSize';
import pushLiteral from './push/handlers/pushLiteral';
import pushLocal from './push/handlers/pushLocal';
import pushMemoryIdentifier from './push/handlers/pushMemoryIdentifier';
import pushMemoryPointer from './push/handlers/pushMemoryPointer';
import pushMemoryReference from './push/handlers/pushMemoryReference';
import pushStringLiteral from './push/handlers/pushStringLiteral';
import resolveIdentifierPushKind, { IdentifierPushKind } from './push/resolveIdentifierPushKind';

import createInstructionCompilerTestContext from '../utils/testUtils';
import { ErrorCode, getError } from '../errors';
import { ArgumentType } from '../types';
import { withValidation } from '../withValidation';

import type { AST, InstructionCompiler, MemoryMap } from '../types';

/**
 * Instruction compiler for `push`.
 * @see [Instruction docs](../../docs/instructions/stack.md)
 */
const push: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const argument = line.arguments[0];

		if (argument.type === ArgumentType.STRING_LITERAL) {
			return pushStringLiteral(argument, context);
		}

		if (argument.type === ArgumentType.IDENTIFIER) {
			switch (resolveIdentifierPushKind(context.namespace, argument.value)) {
				case IdentifierPushKind.MEMORY_IDENTIFIER:
					return pushMemoryIdentifier(line, context);
				case IdentifierPushKind.MEMORY_POINTER:
					return pushMemoryPointer(line, context);
				case IdentifierPushKind.MEMORY_REFERENCE:
					return pushMemoryReference(line, context);
				case IdentifierPushKind.ELEMENT_COUNT:
					return pushElementCount(line, context);
				case IdentifierPushKind.ELEMENT_WORD_SIZE:
					return pushElementWordSize(line, context);
				case IdentifierPushKind.ELEMENT_MAX:
					return pushElementMax(line, context);
				case IdentifierPushKind.ELEMENT_MIN:
					return pushElementMin(line, context);
				case IdentifierPushKind.CONST:
					return pushConst(line, context);
				case IdentifierPushKind.LOCAL:
				default:
					return pushLocal(line, context);
			}
		} else {
			return pushLiteral(argument, context);
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
				byteCode: context.byteCode,
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
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on missing argument', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				push({ lineNumber: 1, instruction: 'push', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('expands a string literal into per-byte i32.const pushes', () => {
			const context = createInstructionCompilerTestContext();

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.STRING_LITERAL, value: 'hi' }],
				} as AST[number],
				context
			);

			// 'h'=104, 'i'=105 → two stack items
			expect(context.stack).toHaveLength(2);
			expect(context.stack[0]).toMatchObject({ isInteger: true });
			expect(context.stack[1]).toMatchObject({ isInteger: true });
		});

		it('pushes a f64 literal value emitting f64.const', () => {
			const context = createInstructionCompilerTestContext();

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 3.14, isInteger: false, isFloat64: true }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('tracks isFloat64 on the stack item for f64 literal', () => {
			const context = createInstructionCompilerTestContext();

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false, isFloat64: true }],
				} as AST[number],
				context
			);

			expect(context.stack[0].isFloat64).toBe(true);
			expect(context.stack[0].isInteger).toBe(false);
		});

		it('pushes a f64 constant emitting f64.const', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: {
						PI64: { value: 3.141592653589793, isInteger: false, isFloat64: true },
					},
				},
			});

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'PI64' }],
				} as AST[number],
				context
			);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('tracks isFloat64 on the stack item for f64 constant', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: {
						PI64: { value: 3.141592653589793, isInteger: false, isFloat64: true },
					},
				},
			});

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'PI64' }],
				} as AST[number],
				context
			);

			expect(context.stack[0].isFloat64).toBe(true);
			expect(context.stack[0].isInteger).toBe(false);
		});

		it('float32 literal push does not emit f64.const', () => {
			const context = createInstructionCompilerTestContext();

			push(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.LITERAL, value: 3.14, isInteger: false }],
				} as AST[number],
				context
			);

			expect(context.stack[0].isFloat64).toBeUndefined();
			// f32.const opcode is 67 (0x43), f64.const opcode is 68 (0x44)
			expect(context.byteCode[0]).toBe(67);
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
				}).toMatchSnapshot();
			});

			it('pushes max finite value for float64', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF64: {
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '^myF64' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
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
					byteCode: context.byteCode,
				}).toMatchSnapshot();
			});

			it('pushes lowest finite value for float64', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF64: {
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '!myF64' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					byteCode: context.byteCode,
				}).toMatchSnapshot();
			});
		});

		describe('float64 memory push', () => {
			it('pushes a float64 memory identifier using f64.load', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF64: {
								byteAddress: 0,
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF64' }],
					} as AST[number],
					context
				);

				expect({
					stack: context.stack,
					byteCode: context.byteCode,
				}).toMatchSnapshot();
			});

			it('tracks isFloat64 on the stack item', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF64: {
								byteAddress: 8,
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF64' }],
					} as AST[number],
					context
				);

				expect(context.stack[0].isFloat64).toBe(true);
				expect(context.stack[0].isInteger).toBe(false);
			});

			it('float32 memory push does not set isFloat64', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF32: {
								byteAddress: 0,
								elementWordSize: 4,
								isInteger: false,
								isFloat64: false,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF32' }],
					} as AST[number],
					context
				);

				expect(context.stack[0].isFloat64).toBeUndefined();
				expect(context.stack[0].isInteger).toBe(false);
			});

			it('emits f64.load (opcode 43) for float64 memory', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF64: {
								byteAddress: 0,
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF64' }],
					} as AST[number],
					context
				);

				// byteCode: i32const(0) + f64load() = [65, 0, 43, 3, 0]
				expect(context.byteCode).toContain(43); // F64_LOAD opcode
			});

			it('emits f32.load (opcode 42) for float32 memory, not f64.load', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myF32: {
								byteAddress: 0,
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
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF32' }],
					} as AST[number],
					context
				);

				expect(context.byteCode).toContain(42); // F32_LOAD opcode
				expect(context.byteCode).not.toContain(43); // no F64_LOAD
			});

			it('dereferencing float64* emits f64.load and marks stack item as float64', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							floatPointer: {
								byteAddress: 0,
								type: 'float64*',
								isPointingToInteger: false,
								isPointingToPointer: false,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '*floatPointer' }],
					} as AST[number],
					context
				);

				expect(context.stack[0]).toMatchObject({ isInteger: false, isFloat64: true });
				expect(context.byteCode).toContain(43); // F64_LOAD opcode
			});

			it('dereferencing float64** still resolves to a float64 value', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							floatPointerPointer: {
								byteAddress: 0,
								type: 'float64**',
								isPointingToInteger: false,
								isPointingToPointer: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: '*floatPointerPointer' }],
					} as AST[number],
					context
				);

				expect(context.stack[0]).toMatchObject({ isInteger: false, isFloat64: true });
				expect(context.byteCode).toContain(43); // F64_LOAD opcode
			});

			it('handles mixed int32/float32/float64 memory layout', () => {
				const context = createInstructionCompilerTestContext({
					namespace: {
						...createInstructionCompilerTestContext().namespace,
						memory: {
							myInt: {
								byteAddress: 0,
								elementWordSize: 4,
								isInteger: true,
							} as unknown as MemoryMap[string],
							myFloat: {
								byteAddress: 4,
								elementWordSize: 4,
								isInteger: false,
							} as unknown as MemoryMap[string],
							myF64: {
								byteAddress: 8,
								elementWordSize: 8,
								isInteger: false,
								isFloat64: true,
							} as unknown as MemoryMap[string],
						},
					},
				});

				const contextInt = { ...context, stack: [] as typeof context.stack, byteCode: [] as typeof context.byteCode };
				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myInt' }],
					} as AST[number],
					contextInt
				);
				expect(contextInt.stack[0]).toMatchObject({ isInteger: true });
				expect(contextInt.byteCode).not.toContain(42);
				expect(contextInt.byteCode).not.toContain(43);

				const contextFloat = { ...context, stack: [] as typeof context.stack, byteCode: [] as typeof context.byteCode };
				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myFloat' }],
					} as AST[number],
					contextFloat
				);
				expect(contextFloat.stack[0]).toMatchObject({ isInteger: false });
				expect(contextFloat.stack[0].isFloat64).toBeUndefined();
				expect(contextFloat.byteCode).toContain(42); // F32_LOAD

				const contextF64 = { ...context, stack: [] as typeof context.stack, byteCode: [] as typeof context.byteCode };
				push(
					{
						lineNumber: 1,
						instruction: 'push',
						arguments: [{ type: ArgumentType.IDENTIFIER, value: 'myF64' }],
					} as AST[number],
					contextF64
				);
				expect(contextF64.stack[0]).toMatchObject({ isInteger: false, isFloat64: true });
				expect(contextF64.byteCode).toContain(43); // F64_LOAD
			});
		});
	});
}
