import { SyntaxErrorCode } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import compile, { serializeDiagnostic } from '.';

const emptyCompileInput = {
	constants: [],
	functions: [],
	prototypes: [],
	macros: [],
};

describe('compile prototype validation', () => {
	it('rejects prototype block markers inside module source', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: {
						main: [
							{
								code: ['module main', 'prototype nested', 'int value 1', 'prototypeEnd', 'moduleEnd'],
							},
						],
					},
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: SyntaxErrorCode.INSTRUCTION_NOT_ALLOWED_IN_BLOCK,
			line: expect.objectContaining({ instruction: 'prototype' }),
		});
	});

	it('reports a tokenizer diagnostic when a prototype is missing an id', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [] },
					prototypes: [{ code: ['prototype', 'prototypeEnd'] }],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: SyntaxErrorCode.MISSING_ARGUMENT,
			message: 'Missing required argument for prototype.',
			line: expect.objectContaining({ instruction: 'prototype' }),
		});
	});

	it('reports a syntax diagnostic when shape is missing a prototype id', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: {
						main: [
							{
								code: ['module main', 'shape', 'moduleEnd'],
							},
						],
					},
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: SyntaxErrorCode.MISSING_ARGUMENT,
			message: 'Missing required argument for shape.',
			line: expect.objectContaining({ instruction: 'shape' }),
		});
	});

	it('expands macro-produced shapes after macro expansion reaches the tokenizer', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: {
					main: [{ code: ['module main', 'macro addStateShape', 'moduleEnd'] }],
				},
				prototypes: [{ code: ['prototype state', 'int value 7', 'prototypeEnd'] }],
				macros: [{ code: ['defineMacro addStateShape', 'shape state', 'defineMacroEnd'] }],
			},
			{ disableSharedMemory: true }
		);

		expect(result.compiledModules.main.memoryMap.value.default).toBe(7);
	});
});
