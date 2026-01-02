import { describe, it, expect } from 'vitest';

import parseMemoryInstructionArguments from '../../src/utils/memoryInstructionParser';
import { ArgumentType, type CompilationContext } from '../../src/types';

describe('parseMemoryInstructionArguments', () => {
	const createMockContext = (memory = {}, consts = {}): CompilationContext => ({
		namespace: {
			memory,
			consts,
			locals: {},
			namespaces: {},
			functions: {},
			moduleName: 'test',
		},
		initSegmentByteCode: [],
		loopSegmentByteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		memoryByteSize: 0,
		mode: 'module',
	});

	describe('first argument handling', () => {
		it('should handle literal as first argument', () => {
			const args = [{ type: ArgumentType.LITERAL, value: 42 }];
			const result = parseMemoryInstructionArguments(args, 1, 'float', createMockContext());
			expect(result).toEqual({ id: '__anonymous__1', defaultValue: 42 });
		});

		it('should handle identifier that is a constant as first argument', () => {
			const context = createMockContext({}, { MY_CONST: { value: 100, isInteger: true } });
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'MY_CONST' }];
			const result = parseMemoryInstructionArguments(args, 2, 'int', context);
			expect(result).toEqual({ id: '__anonymous__2', defaultValue: 100 });
		});

		it('should use identifier as id when not a constant', () => {
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'myVar' }];
			const result = parseMemoryInstructionArguments(args, 3, 'float', createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0 });
		});
	});

	describe('second argument handling - literals', () => {
		it('should override defaultValue with literal second argument', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 50 },
			];
			const result = parseMemoryInstructionArguments(args, 4, 'int', createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 50 });
		});
	});

	describe('second argument handling - intermodular references', () => {
		it('should handle intermodular reference without error', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'bufferIn' },
				{ type: ArgumentType.IDENTIFIER, value: '&notesMux2.out.notes' },
			];
			const result = parseMemoryInstructionArguments(args, 5, 'float*', createMockContext());
			// Intermodular references are resolved later, so defaultValue stays 0
			expect(result).toEqual({ id: 'bufferIn', defaultValue: 0 });
		});

		it('should handle another intermodular reference pattern', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&module.identifier' },
			];
			const result = parseMemoryInstructionArguments(args, 6, 'int*', createMockContext());
			expect(result).toEqual({ id: 'myPtr', defaultValue: 0 });
		});
	});

	describe('second argument handling - memory references', () => {
		it('should resolve memory reference with & prefix', () => {
			const memory = {
				out1: { byteAddress: 100, wordAlignedSize: 1, isInteger: false, isPointer: false },
			};
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&out1' },
			];
			const result = parseMemoryInstructionArguments(args, 7, 'float*', createMockContext(memory));
			expect(result).toEqual({ id: 'myPtr', defaultValue: 100 });
		});

		it('should throw error when memory reference does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&nonExistent' },
			];
			expect(() => {
				parseMemoryInstructionArguments(args, 8, 'float*', createMockContext());
			}).toThrow();
		});
	});

	describe('second argument handling - element count', () => {
		it('should resolve element count with $ prefix', () => {
			const memory = {
				buffer: { byteAddress: 200, wordAlignedSize: 10, isInteger: true, isPointer: false },
			};
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'count' },
				{ type: ArgumentType.IDENTIFIER, value: '$buffer' },
			];
			const result = parseMemoryInstructionArguments(args, 9, 'int', createMockContext(memory));
			expect(result).toEqual({ id: 'count', defaultValue: 10 });
		});

		it('should throw error when element count reference does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'count' },
				{ type: ArgumentType.IDENTIFIER, value: '$nonExistent' },
			];
			expect(() => {
				parseMemoryInstructionArguments(args, 10, 'int', createMockContext());
			}).toThrow();
		});
	});

	describe('second argument handling - constants', () => {
		it('should resolve constant as second argument', () => {
			const context = createMockContext({}, { INIT_VALUE: { value: 999, isInteger: true } });
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'INIT_VALUE' },
			];
			const result = parseMemoryInstructionArguments(args, 11, 'int', context);
			expect(result).toEqual({ id: 'myVar', defaultValue: 999 });
		});

		it('should throw error when constant does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'UNKNOWN_CONST' },
			];
			expect(() => {
				parseMemoryInstructionArguments(args, 12, 'int', createMockContext());
			}).toThrow();
		});
	});

	describe('error handling', () => {
		it('should throw error when first argument is missing', () => {
			expect(() => {
				parseMemoryInstructionArguments([], 13, 'float', createMockContext());
			}).toThrow();
		});
	});

	describe('edge cases', () => {
		it('should handle only first argument provided', () => {
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'solo' }];
			const result = parseMemoryInstructionArguments(args, 14, 'float', createMockContext());
			expect(result).toEqual({ id: 'solo', defaultValue: 0 });
		});

		it('should prioritize intermodular check before memory reference check', () => {
			// Even if a memory item exists with name matching the pattern,
			// intermodular references should be detected first
			const memory = {
				'module.identifier': { byteAddress: 123, wordAlignedSize: 1, isInteger: false, isPointer: false },
			};
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'test' },
				{ type: ArgumentType.IDENTIFIER, value: '&module.identifier' },
			];
			const result = parseMemoryInstructionArguments(args, 15, 'float*', createMockContext(memory));
			// Should be treated as intermodular, not memory reference
			expect(result).toEqual({ id: 'test', defaultValue: 0 });
		});
	});
});
