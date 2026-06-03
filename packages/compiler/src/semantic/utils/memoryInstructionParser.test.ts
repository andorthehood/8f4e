import type { Argument, CompilationContext } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import parseMemoryInstructionArguments from './memoryInstructionParser';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('parseMemoryInstructionArguments', () => {
	const mockContext = {
		namespace: {
			consts: {
				myConst: { value: 42, isInteger: true },
				HI: { value: 32, isInteger: true },
				LO: { value: 64, isInteger: true },
				BIG: { value: 300, isInteger: true },
				FRAC: { value: 0.5, isInteger: false },
			},
			memory: {
				myVar: {
					byteAddress: 100,
					wordAlignedSize: 5,
				} as unknown as CompilationContext['namespace']['memory'][string],
			},
		},
	} as unknown as CompilationContext;

	it('parses literal argument as anonymous variable', () => {
		const args: Argument[] = [{ type: ArgumentType.LITERAL, value: 123, isInteger: true }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 10,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('__anonymous__10');
		expect(result.defaultValue).toBe(123);
	});

	it('parses zero arguments as anonymous zero-initialized memory', () => {
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 9,
				instruction: 'int',
				arguments: [],
			},
			mockContext
		);
		expect(result).toEqual({
			id: '__anonymous__9',
			defaultValue: 0,
		});
	});

	it('parses string literal argument as anonymous byte default', () => {
		const args: Argument[] = [{ type: ArgumentType.STRING_LITERAL, value: 'e' }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 11,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('__anonymous__11');
		expect(result.defaultValue).toBe(101);
	});

	it('packs anonymous multi-character string literal defaults as split bytes', () => {
		const args: Argument[] = [{ type: ArgumentType.STRING_LITERAL, value: 'AB' }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 12,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('__anonymous__12');
		expect(result.defaultValue).toBe(0x41420000);
	});

	it('parses identifier argument', () => {
		const args: Argument[] = [classifyIdentifier('myId')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 20,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myId');
		expect(result.defaultValue).toBe(0);
	});

	it('rejects unnormalized constant-style identifiers as memory names', () => {
		const args: Argument[] = [classifyIdentifier('MY_CONST')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 30,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('rejects reserved identifier this as a memory name', () => {
		const args: Argument[] = [classifyIdentifier('this')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 31,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('parses identifier with literal default value', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), { type: ArgumentType.LITERAL, value: 99, isInteger: true }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 40,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		expect(result.defaultValue).toBe(99);
	});

	it('parses identifier with string literal default value', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), { type: ArgumentType.STRING_LITERAL, value: 'e' }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 41,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		expect(result.defaultValue).toBe(101);
	});

	it('packs identifier multi-character string literal defaults as split bytes', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), { type: ArgumentType.STRING_LITERAL, value: 'AB' }];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 42,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		expect(result.defaultValue).toBe(0x41420000);
	});

	it('rejects unnormalized identifier defaults that were not folded earlier', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('myConst')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 50,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('rejects unresolved intermodule address-reference identifiers that reach the parser', () => {
		// Intermodule address refs must be resolved or stripped by normalizeMemoryDeclaration
		// before reaching parseMemoryInstructionArguments; they must not silently return 0.
		const intermoduleRef = classifyIdentifier('&otherModule:someVar');
		const args: Argument[] = [classifyIdentifier('myVar'), intermoduleRef];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 55,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('rejects special references as memory declaration names', () => {
		const args: Argument[] = [classifyIdentifier('&myVar')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 56,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('combines named split hex bytes into one integer default (2 bytes, right-padded)', () => {
		const args: Argument[] = [
			classifyIdentifier('myVar'),
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
		];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 60,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		expect(result.defaultValue).toBe(0xa8ff0000);
	});

	it('combines named split hex bytes into one integer default (4 bytes)', () => {
		const args: Argument[] = [
			classifyIdentifier('myVar'),
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
		];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 70,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		expect(result.defaultValue).toBe(0xa8ff0000);
	});

	it('combines anonymous split hex bytes into one integer default', () => {
		const args: Argument[] = [
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
		];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 80,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('__anonymous__80');
		expect(result.defaultValue).toBe(0xa8ff0000);
	});

	it('throws SPLIT_HEX_TOO_MANY_BYTES when byte count exceeds type width', () => {
		const args: Argument[] = [
			classifyIdentifier('myVar'),
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			{ type: ArgumentType.LITERAL, value: 0x01, isInteger: true, isHex: true },
		];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 90,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('resolves named constant split-byte sequence (HI LO) into combined default', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('LO')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 100,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
		expect(result.defaultValue).toBe(0x20400000);
	});

	it('resolves anonymous constant split-byte sequence (HI LO) into combined default', () => {
		const args: Argument[] = [classifyIdentifier('HI'), classifyIdentifier('LO')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 110,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('__anonymous__110');
		expect(result.defaultValue).toBe(0x20400000);
	});

	it('resolves mixed byte literal and constant in named split-byte', () => {
		const args: Argument[] = [
			classifyIdentifier('myVar'),
			{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
			classifyIdentifier('LO'),
		];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 120,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('myVar');
		// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
		expect(result.defaultValue).toBe(0xa8400000);
	});

	it('throws when constant in split-byte sequence is out of byte range (> 255)', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('BIG')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 130,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('throws when constant in split-byte sequence is a non-integer (float)', () => {
		const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('FRAC')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 140,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('throws when constant-style name is used as memory identifier', () => {
		const args: Argument[] = [classifyIdentifier('MY_VAR')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 150,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('resolves memory-reference default (&myVar) to byteAddress', () => {
		const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('&myVar')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 160,
				instruction: 'int*',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('ptr');
		// myVar has byteAddress 100
		expect(result.defaultValue).toBe(100);
	});

	it('resolves current-module memory-reference defaults', () => {
		const context = {
			...mockContext,
			startingByteAddress: 20,
			currentModuleWordAlignedSize: 3,
		} as unknown as CompilationContext;

		expect(
			parseMemoryInstructionArguments(
				{
					lineNumber: 161,
					instruction: 'int*',
					arguments: [classifyIdentifier('ptr'), classifyIdentifier('&this')],
				},
				context
			).defaultValue
		).toBe(20);
		expect(
			parseMemoryInstructionArguments(
				{
					lineNumber: 162,
					instruction: 'int*',
					arguments: [classifyIdentifier('ptr'), classifyIdentifier('this&')],
				},
				context
			).defaultValue
		).toBe(28);
	});

	it('falls back to zero for current-module end-address default before module size is known', () => {
		const context = {
			...mockContext,
			startingByteAddress: 20,
			currentModuleWordAlignedSize: undefined,
		} as unknown as CompilationContext;

		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 163,
				instruction: 'int*',
				arguments: [classifyIdentifier('ptr'), classifyIdentifier('this&')],
			},
			context
		);

		expect(result.defaultValue).toBe(0);
	});

	it('resolves memory-reference end-address default (myVar&) to last byte address', () => {
		const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('myVar&')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 165,
				instruction: 'int*',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('ptr');
		// byteAddress + (wordAlignedSize - 1) * 4 = 100 + (5 - 1) * 4 = 116
		expect(result.defaultValue).toBe(116);
	});

	it('resolves element-count default (count(myVar)) to wordAlignedSize', () => {
		const args: Argument[] = [classifyIdentifier('n'), classifyIdentifier('count(myVar)')];
		const result = parseMemoryInstructionArguments(
			{
				lineNumber: 170,
				instruction: 'int',
				arguments: args,
			},
			mockContext
		);
		expect(result.id).toBe('n');
		// myVar has wordAlignedSize 5
		expect(result.defaultValue).toBe(5);
	});

	it('throws UNDECLARED_IDENTIFIER when memory-reference target does not exist', () => {
		const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('&noSuch')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 175,
					instruction: 'int*',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});

	it('throws UNDECLARED_IDENTIFIER when element-count target does not exist', () => {
		const args: Argument[] = [classifyIdentifier('n'), classifyIdentifier('count(noSuch)')];
		expect(() =>
			parseMemoryInstructionArguments(
				{
					lineNumber: 180,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			)
		).toThrow();
	});
});
