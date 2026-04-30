import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';

import push from './push';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, MemoryMap } from '@8f4e/compiler-types';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('push instruction compiler', () => {
	it('pushes a literal value', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
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

	it('pushes a normalized literal value', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [{ type: ArgumentType.LITERAL, value: 42, isInteger: true }],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('tracks address range metadata on normalized address literals', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 12,
						isInteger: true,
						safeAddressRange: {
							source: 'memory-start',
							byteAddress: 12,
							safeByteLength: 16,
							memoryId: 'buffer',
						},
					},
				],
			} as AST[number],
			context
		);

		expect(context.stack[0]).toMatchObject({
			isInteger: true,
			isNonZero: true,
			safeAddressRange: {
				source: 'memory-start',
				byteAddress: 12,
				safeByteLength: 16,
				memoryId: 'buffer',
			},
		});
	});

	it('expands a string literal into per-byte i32.const pushes', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 3.14,
						isInteger: false,
						isFloat64: true,
					},
				],
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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 1.5,
						isInteger: false,
						isFloat64: true,
					},
				],
			} as AST[number],
			context
		);

		expect(context.stack[0].isFloat64).toBe(true);
		expect(context.stack[0].isInteger).toBe(false);
	});

	it('pushes a normalized f64 literal emitting f64.const', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 3.141592653589793,
						isInteger: false,
						isFloat64: true,
					},
				],
			} as AST[number],
			context
		);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toMatchSnapshot();
	});

	it('tracks isFloat64 on the stack item for normalized f64 literal', () => {
		const context = createInstructionCompilerTestContext();

		push(
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [
					{
						type: ArgumentType.LITERAL,
						value: 3.141592653589793,
						isInteger: false,
						isFloat64: true,
					},
				],
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
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'push',
				arguments: [{ type: ArgumentType.LITERAL, value: 3.14, isInteger: false }],
			} as AST[number],
			context
		);

		expect(context.stack[0].isFloat64).toBeUndefined();
		// f32.const opcode is 67 (0x43), f64.const opcode is 68 (0x44)
		expect(context.byteCode[0]).toBe(67);
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF64')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF64')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF32')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF64')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF32')],
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
							pointeeBaseType: 'float64',
							isPointingToPointer: false,
						} as unknown as MemoryMap[string],
					},
				},
			});

			push(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*floatPointer')],
				} as AST[number],
				context
			);

			expect(context.stack[0]).toMatchObject({
				isInteger: false,
				isFloat64: true,
			});
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
							pointeeBaseType: 'float64',
							isPointingToPointer: true,
						} as unknown as MemoryMap[string],
					},
				},
			});

			push(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('*floatPointerPointer')],
				} as AST[number],
				context
			);

			expect(context.stack[0]).toMatchObject({
				isInteger: false,
				isFloat64: true,
			});
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

			const contextInt = {
				...context,
				stack: [] as typeof context.stack,
				byteCode: [] as typeof context.byteCode,
			};
			push(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myInt')],
				} as AST[number],
				contextInt
			);
			expect(contextInt.stack[0]).toMatchObject({ isInteger: true });
			expect(contextInt.byteCode).not.toContain(42);
			expect(contextInt.byteCode).not.toContain(43);

			const contextFloat = {
				...context,
				stack: [] as typeof context.stack,
				byteCode: [] as typeof context.byteCode,
			};
			push(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myFloat')],
				} as AST[number],
				contextFloat
			);
			expect(contextFloat.stack[0]).toMatchObject({ isInteger: false });
			expect(contextFloat.stack[0].isFloat64).toBeUndefined();
			expect(contextFloat.byteCode).toContain(42); // F32_LOAD

			const contextF64 = {
				...context,
				stack: [] as typeof context.stack,
				byteCode: [] as typeof context.byteCode,
			};
			push(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('myF64')],
				} as AST[number],
				contextF64
			);
			expect(contextF64.stack[0]).toMatchObject({
				isInteger: false,
				isFloat64: true,
			});
			expect(contextF64.byteCode).toContain(43); // F64_LOAD
		});
	});
});
