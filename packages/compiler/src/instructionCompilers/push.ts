import { withValidation } from '../withValidation';
import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import f32const from '../wasmUtils/const/f32const';
import f64const from '../wasmUtils/const/f64const';
import i32const from '../wasmUtils/const/i32const';
import f32load from '../wasmUtils/load/f32load';
import f64load from '../wasmUtils/load/f64load';
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

import type { AST, DataStructure, InstructionCompiler, MemoryMap, StackItem } from '../types';

type ValueKind = 'int32' | 'float32' | 'float64';

function resolveMemoryValueKind(memoryItem: DataStructure): ValueKind {
	if (memoryItem.isInteger) return 'int32';
	if (memoryItem.isFloat64) return 'float64';
	return 'float32';
}

function resolveArgumentValueKind(argument: { isInteger: boolean; isFloat64?: boolean }): ValueKind {
	if (argument.isFloat64) return 'float64';
	return argument.isInteger ? 'int32' : 'float32';
}

function resolvePointerTargetValueKind(memoryItem: DataStructure): ValueKind {
	if (memoryItem.isPointingToInteger) return 'int32';
	const memoryType = String(memoryItem.type);
	if (memoryType.startsWith('float64')) return 'float64';
	return 'float32';
}

const constOpcode: Record<ValueKind, (value: number) => number[]> = {
	int32: i32const,
	float32: f32const,
	float64: f64const,
};

const loadOpcode: Record<ValueKind, () => number[]> = {
	int32: () => i32load(),
	float32: () => f32load(),
	float64: () => f64load(),
};

function kindToStackItem(kind: ValueKind, extras?: Partial<StackItem>): StackItem {
	return { isInteger: kind === 'int32', ...(kind === 'float64' ? { isFloat64: true } : {}), ...extras };
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

				const kind = resolveMemoryValueKind(memoryItem);
				context.stack.push(kindToStackItem(kind, { isNonZero: false }));

				return saveByteCode(context, [...i32const(memoryItem.byteAddress), ...loadOpcode[kind]()]);
			} else if (isMemoryPointerIdentifier(memory, argument.value)) {
				const base = extractMemoryPointerBase(argument.value);
				const memoryItem = getDataStructure(memory, base);

				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}

				const kind = resolvePointerTargetValueKind(memoryItem);
				context.stack.push(kindToStackItem(kind, { isNonZero: false }));

				return saveByteCode(context, [
					...i32const(memoryItem.byteAddress),
					...(memoryItem.isPointingToPointer ? [...i32load(), ...i32load()] : i32load()),
					...loadOpcode[kind](),
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
				const kind = resolveMemoryValueKind(memoryItem);
				const maxValue = getElementMaxValue(memory, base);
				context.stack.push(kindToStackItem(kind, { isNonZero: maxValue !== 0 }));
				return saveByteCode(context, constOpcode[kind](maxValue));
			} else if (isElementMinIdentifier(memory, argument.value)) {
				const base = extractElementMinBase(argument.value);
				const memoryItem = getDataStructure(memory, base);
				if (!memoryItem) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}
				const kind = resolveMemoryValueKind(memoryItem);
				const minValue = getElementMinValue(memory, base);
				context.stack.push(kindToStackItem(kind, { isNonZero: minValue !== 0 }));
				return saveByteCode(context, constOpcode[kind](minValue));
			} else if (typeof consts[argument.value] !== 'undefined') {
				const constItem = consts[argument.value];
				const kind = resolveArgumentValueKind(constItem);
				context.stack.push(kindToStackItem(kind, { isNonZero: constItem.value !== 0 }));
				return saveByteCode(context, constOpcode[kind](constItem.value));
			} else {
				const local = locals[argument.value];

				if (!local) {
					throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
				}

				context.stack.push({ isInteger: local.isInteger, isNonZero: false });

				return saveByteCode(context, localGet(local.index));
			}
		} else {
			const kind = resolveArgumentValueKind(argument);
			context.stack.push(kindToStackItem(kind, { isNonZero: argument.value !== 0 }));
			return saveByteCode(context, constOpcode[kind](argument.value));
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
