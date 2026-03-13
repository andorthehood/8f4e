import { describe, it, expect } from 'vitest';

import parseMemoryInstructionArguments from '../../src/utils/memoryInstructionParser';
import { ArgumentType, type AST, type CompilationContext } from '../../src/types';

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
		byteCode: [],
		stack: [],
		blockStack: [],
		startingByteAddress: 0,
		memoryByteSize: 0,
		mode: 'module',
	});

	const createLine = (lineNumber: number, instruction: AST[number]['instruction'], args: AST[number]['arguments']) => ({
		lineNumberBeforeMacroExpansion: lineNumber,
		lineNumberAfterMacroExpansion: lineNumber,
		instruction,
		arguments: args,
	});

	describe('first argument handling', () => {
		it('should handle literal as first argument', () => {
			const args = [{ type: ArgumentType.LITERAL, value: 42 }];
			const result = parseMemoryInstructionArguments(createLine(1, 'float', args), createMockContext());
			expect(result).toEqual({ id: '__anonymous__1', defaultValue: 42 });
		});

		it('should handle identifier that is a constant as first argument', () => {
			const context = createMockContext({}, { MY_CONST: { value: 100, isInteger: true } });
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'MY_CONST' }];
			const result = parseMemoryInstructionArguments(createLine(2, 'int', args), context);
			expect(result).toEqual({ id: '__anonymous__2', defaultValue: 100 });
		});

		it('should use identifier as id when not a constant', () => {
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'myVar' }];
			const result = parseMemoryInstructionArguments(createLine(3, 'float', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0 });
		});
	});

	describe('second argument handling - literals', () => {
		it('should override defaultValue with literal second argument', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 50 },
			];
			const result = parseMemoryInstructionArguments(createLine(4, 'int', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 50 });
		});
	});

	describe('second argument handling - intermodular references', () => {
		it('should handle intermodular reference without error', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'bufferIn' },
				{ type: ArgumentType.IDENTIFIER, value: '&notesMux2:out' },
			];
			const result = parseMemoryInstructionArguments(createLine(5, 'float*', args), createMockContext());
			// Intermodular references are resolved later, so defaultValue stays 0
			expect(result).toEqual({ id: 'bufferIn', defaultValue: 0 });
		});

		it('should handle another intermodular reference pattern', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&module:identifier' },
			];
			const result = parseMemoryInstructionArguments(createLine(6, 'int*', args), createMockContext());
			expect(result).toEqual({ id: 'myPtr', defaultValue: 0 });
		});

		it('should handle intermodular module-base start reference without error', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&module:' },
			];
			const result = parseMemoryInstructionArguments(createLine(6, 'int*', args), createMockContext());
			expect(result).toEqual({ id: 'myPtr', defaultValue: 0 });
		});

		it('should handle intermodular module-base end reference without error', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: 'module:&' },
			];
			const result = parseMemoryInstructionArguments(createLine(6, 'int*', args), createMockContext());
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
			const result = parseMemoryInstructionArguments(createLine(7, 'float*', args), createMockContext(memory));
			expect(result).toEqual({ id: 'myPtr', defaultValue: 100 });
		});

		it('should resolve memory reference with & suffix to end address', () => {
			const memory = {
				buffer: { byteAddress: 100, wordAlignedSize: 5, isInteger: true, isPointer: false },
			};
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: 'buffer&' },
			];
			const result = parseMemoryInstructionArguments(createLine(7, 'int*', args), createMockContext(memory));
			// End address should be: byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY
			// = 100 + (5 - 1) * 4 = 100 + 16 = 116
			expect(result).toEqual({ id: 'myPtr', defaultValue: 116 });
		});

		it('should throw error when memory reference does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myPtr' },
				{ type: ArgumentType.IDENTIFIER, value: '&nonExistent' },
			];
			expect(() => {
				parseMemoryInstructionArguments(createLine(8, 'float*', args), createMockContext());
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
			const result = parseMemoryInstructionArguments(createLine(9, 'int', args), createMockContext(memory));
			expect(result).toEqual({ id: 'count', defaultValue: 10 });
		});

		it('should throw error when element count reference does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'count' },
				{ type: ArgumentType.IDENTIFIER, value: '$nonExistent' },
			];
			expect(() => {
				parseMemoryInstructionArguments(createLine(10, 'int', args), createMockContext());
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
			const result = parseMemoryInstructionArguments(createLine(11, 'int', args), context);
			expect(result).toEqual({ id: 'myVar', defaultValue: 999 });
		});

		it('should throw error when constant does not exist', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'UNKNOWN_CONST' },
			];
			expect(() => {
				parseMemoryInstructionArguments(createLine(12, 'int', args), createMockContext());
			}).toThrow();
		});
	});

	describe('error handling', () => {
		it('should throw error when first argument is missing', () => {
			expect(() => {
				parseMemoryInstructionArguments(createLine(13, 'float', []), createMockContext());
			}).toThrow();
		});
	});

	describe('split-byte default values (decimal and hex)', () => {
		it('should combine 2 named hex-byte literals into a right-padded 32-bit default', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(createLine(20, 'int', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8ff0000 });
		});

		it('should combine 4 named hex-byte literals into a 32-bit default', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(createLine(21, 'int', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8ff0000 });
		});

		it('should combine anonymous split hex bytes', () => {
			const args = [
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(createLine(22, 'int', args), createMockContext());
			expect(result).toEqual({ id: '__anonymous__22', defaultValue: 0xa8ff0000 });
		});

		it('should treat single hex-byte literal as a regular literal (no split)', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(createLine(23, 'int', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8 });
		});

		it('should combine 2 named decimal byte literals into a right-padded 32-bit default', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 64, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(createLine(28, 'int', args), createMockContext());
			// 32 = 0x20, 64 = 0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
			expect(result).toEqual({ id: 'myVar', defaultValue: 0x20400000 });
		});

		it('should combine 4 named decimal byte literals into a 32-bit default', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 64, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 0, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 0, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(createLine(29, 'int', args), createMockContext());
			expect(result).toEqual({ id: 'myVar', defaultValue: 0x20400000 });
		});

		it('should combine anonymous decimal byte literals', () => {
			const args = [
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 64, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(createLine(30, 'int', args), createMockContext());
			expect(result).toEqual({ id: '__anonymous__30', defaultValue: 0x20400000 });
		});

		it('should treat single decimal byte literal as a regular literal (no split)', () => {
			const args = [{ type: ArgumentType.LITERAL, value: 32, isInteger: true }];
			const result = parseMemoryInstructionArguments(createLine(31, 'int', args), createMockContext());
			expect(result).toEqual({ id: '__anonymous__31', defaultValue: 32 });
		});

		it('should allow mixed hex and decimal byte literals in a split-byte sequence', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 255, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(createLine(32, 'int', args), createMockContext());
			// 0xA8=168, 255=0xFF → [168, 255, 0, 0] = 0xA8FF0000
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8ff0000 });
		});

		it('should allow mixed decimal and hex byte literals in anonymous split-byte', () => {
			const args = [
				{ type: ArgumentType.LITERAL, value: 255, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(createLine(33, 'int', args), createMockContext());
			// 255=0xFF, 0xA8=168 → [255, 168, 0, 0] = 0xFFA80000
			expect(result).toEqual({ id: '__anonymous__33', defaultValue: 0xffa80000 });
		});

		it('should throw when split-byte count exceeds 4 for int', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x01, isInteger: true, isHex: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(24, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when a constant identifier in split-byte mode is not in scope', () => {
			// CONST is not defined in the context, so resolution fails
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.IDENTIFIER, value: 'CONST' },
			];
			expect(() => parseMemoryInstructionArguments(createLine(25, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when a byte literal is followed by a value greater than 255', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 256, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(26, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when a byte literal is followed by a negative integer', () => {
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: -5, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(27, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when anonymous byte literal is followed by a non-byte', () => {
			const args = [
				{ type: ArgumentType.LITERAL, value: 32, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 256, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(34, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when named non-byte second arg is followed by extra tokens', () => {
			// int foo 256 1 — 256 is not a valid byte, 1 would be silently ignored without the fix
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 256, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(35, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when anonymous out-of-range first literal is followed by another literal', () => {
			// int 256 1 — 256 is out of byte range so the 1 would otherwise silently become the default
			const args = [
				{ type: ArgumentType.LITERAL, value: 256, isInteger: true },
				{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(36, 'int', args), createMockContext())).toThrow();
		});
	});

	describe('constant split-byte default values', () => {
		it('should combine named constant split-byte (HI LO) into a 32-bit default', () => {
			const context = createMockContext({}, { HI: { value: 32, isInteger: true }, LO: { value: 64, isInteger: true } });
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(createLine(40, 'int', args), context);
			// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
			expect(result).toEqual({ id: 'myVar', defaultValue: 0x20400000 });
		});

		it('should combine anonymous constant split-byte (HI LO) into a 32-bit default', () => {
			const context = createMockContext({}, { HI: { value: 32, isInteger: true }, LO: { value: 64, isInteger: true } });
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(createLine(41, 'int', args), context);
			expect(result).toEqual({ id: '__anonymous__41', defaultValue: 0x20400000 });
		});

		it('should combine named mixed byte literal and constant into a 32-bit default', () => {
			const context = createMockContext({}, { LO: { value: 64, isInteger: true } });
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(createLine(42, 'int', args), context);
			// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8400000 });
		});

		it('should combine anonymous byte literal and constant split-byte', () => {
			const context = createMockContext({}, { LO: { value: 64, isInteger: true } });
			const args = [
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(createLine(43, 'int', args), context);
			// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
			expect(result).toEqual({ id: '__anonymous__43', defaultValue: 0xa8400000 });
		});

		it('should throw when a constant in split-byte resolves to a value greater than 255', () => {
			const context = createMockContext(
				{},
				{ HI: { value: 32, isInteger: true }, BIG: { value: 300, isInteger: true } }
			);
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'BIG' },
			];
			expect(() => parseMemoryInstructionArguments(createLine(44, 'int', args), context)).toThrow();
		});

		it('should throw when a constant in split-byte resolves to a negative value', () => {
			const context = createMockContext(
				{},
				{ HI: { value: 32, isInteger: true }, NEG: { value: -1, isInteger: true } }
			);
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'NEG' },
			];
			expect(() => parseMemoryInstructionArguments(createLine(45, 'int', args), context)).toThrow();
		});

		it('should throw when a constant in split-byte is a non-integer (float)', () => {
			const context = createMockContext(
				{},
				{ HI: { value: 32, isInteger: true }, FRAC: { value: 0.5, isInteger: false } }
			);
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'FRAC' },
			];
			expect(() => parseMemoryInstructionArguments(createLine(46, 'int', args), context)).toThrow();
		});

		it('should throw when constant-style name is used as memory identifier', () => {
			// MY_VAR matches isConstantName — constant-style names are reserved for constants only
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'MY_VAR' }];
			expect(() => parseMemoryInstructionArguments(createLine(47, 'int', args), createMockContext())).toThrow();
		});

		it('should throw when constant-style name as memory identifier has a default value', () => {
			// COUNTER is constant-style and cannot be a memory identifier
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'COUNTER' },
				{ type: ArgumentType.LITERAL, value: 0, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(createLine(48, 'int', args), createMockContext())).toThrow();
		});

		it('should resolve 4-constant split-byte sequence (4 tokens)', () => {
			const context = createMockContext(
				{},
				{
					A: { value: 0xa8, isInteger: true },
					B: { value: 0xff, isInteger: true },
					C: { value: 0, isInteger: true },
					D: { value: 0, isInteger: true },
				}
			);
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'A' },
				{ type: ArgumentType.IDENTIFIER, value: 'B' },
				{ type: ArgumentType.IDENTIFIER, value: 'C' },
				{ type: ArgumentType.IDENTIFIER, value: 'D' },
			];
			const result = parseMemoryInstructionArguments(createLine(49, 'int', args), context);
			expect(result).toEqual({ id: 'myVar', defaultValue: 0xa8ff0000 });
		});
	});

	describe('edge cases', () => {
		it('should handle only first argument provided', () => {
			const args = [{ type: ArgumentType.IDENTIFIER, value: 'solo' }];
			const result = parseMemoryInstructionArguments(createLine(14, 'float', args), createMockContext());
			expect(result).toEqual({ id: 'solo', defaultValue: 0 });
		});

		it('should prioritize intermodular check before memory reference check', () => {
			// Even if a memory item exists with name matching the pattern,
			// intermodular references should be detected first
			const memory = {
				'module:identifier': { byteAddress: 123, wordAlignedSize: 1, isInteger: false, isPointer: false },
			};
			const args = [
				{ type: ArgumentType.IDENTIFIER, value: 'test' },
				{ type: ArgumentType.IDENTIFIER, value: '&module:identifier' },
			];
			const result = parseMemoryInstructionArguments(createLine(15, 'float*', args), createMockContext(memory));
			// Should be treated as intermodular, not memory reference
			expect(result).toEqual({ id: 'test', defaultValue: 0 });
		});
	});
});
