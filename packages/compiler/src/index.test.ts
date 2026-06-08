import { ErrorCode } from '@8f4e/compiler-spec';
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
								projectBlockId: 42,
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
			context: expect.objectContaining({ projectBlockId: 42 }),
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

	it('marks shape-expanded declarations as inherited at the shape line', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: {
					main: [{ code: ['module filterA', 'shape filterState', 'float cutoff 1200', 'moduleEnd'] }],
				},
				prototypes: [
					{
						code: [
							'prototype filterState',
							'float* input',
							'float cutoff 800',
							'float resonance 0.5',
							'float output',
							'prototypeEnd',
						],
					},
				],
			},
			{ disableSharedMemory: true }
		);

		const memoryMap = result.compiledModules.filterA.memoryMap;
		expect(memoryMap.input).toMatchObject({ isInherited: true, lineNumber: 1 });
		expect(memoryMap.resonance).toMatchObject({ isInherited: true, lineNumber: 1 });
		expect(memoryMap.output).toMatchObject({ isInherited: true, lineNumber: 1 });
		expect(memoryMap.cutoff).toMatchObject({ isInherited: false, lineNumber: 2 });
	});

	it('rejects function ids that collide with generated entry function ids during semantic metadata collection', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
					functions: [{ code: ['function main', 'functionEnd'] }],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.DUPLICATE_IDENTIFIER,
			line: expect.objectContaining({ instruction: 'function' }),
		});
	});

	it('rejects duplicate function export names during semantic metadata collection', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'], projectBlockId: 10 }] },
					functions: [
						{ code: ['function first', '#export shared', 'functionEnd'], projectBlockId: 20 },
						{ code: ['function second', '#export shared', 'functionEnd'], projectBlockId: 21 },
					],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.DUPLICATE_EXPORT_NAME,
			line: expect.objectContaining({ instruction: '#export' }),
			context: expect.objectContaining({ projectBlockId: 21 }),
		});
	});

	it('rejects function exports that collide with generated entry exports', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
					functions: [{ code: ['function entryAlias', '#export main', 'functionEnd'] }],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.DUPLICATE_EXPORT_NAME,
			line: expect.objectContaining({ instruction: '#export' }),
		});
	});
});
