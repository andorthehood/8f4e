import { createFunctionId, ErrorCode } from '@8f4e/compiler-spec';
import { SyntaxErrorCode } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import compile, { serializeDiagnostic } from '.';

const emptyCompileInput = {
	constants: [],
	functions: [],
	prototypes: [],
};

async function instantiateCompileResult(codeBuffer: Uint8Array) {
	const memory = new WebAssembly.Memory({ initial: 1, maximum: 1 });
	const result = (await WebAssembly.instantiate(codeBuffer, {
		host: { memory },
	})) as unknown as { instance: WebAssembly.Instance };

	return {
		memory,
		exports: result.instance.exports as Record<string, CallableFunction>,
	};
}

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

	it('expands shapes after prototype parsing reaches the tokenizer', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: {
					main: [{ code: ['module main', 'shape state', 'moduleEnd'] }],
				},
				prototypes: [{ code: ['prototype state', 'int value 7', 'prototypeEnd'] }],
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

	it('finalizes shape-expanded intermodule pointer defaults after stable layout', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: {
					main: [
						{ code: ['module beta', 'shape linkToAlpha', 'moduleEnd'] },
						{ code: ['module alpha', 'int[] buffer 4 10 20 30 40', 'moduleEnd'] },
					],
				},
				prototypes: [{ code: ['prototype linkToAlpha', 'int* ptr &alpha:buffer', 'prototypeEnd'] }],
			},
			{ disableSharedMemory: true }
		);

		const alphaBuffer = result.compiledModules.alpha.memoryMap.buffer;
		const betaPointer = result.compiledModules.beta.memoryMap.ptr;
		expect(betaPointer.default).toBe(alphaBuffer.byteAddress);
		expect(betaPointer.pointeeElementCount).toBe(4);
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

	it('exposes function source names separately from compiler ids', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
				functions: [
					{ code: ['function double', 'param int value', 'push value', 'push value', 'add', 'functionEnd int'] },
				],
			},
			{ disableSharedMemory: true }
		);

		const functionId = createFunctionId('double', ['int']);
		expect(result.compiledFunctions![functionId]).toMatchObject({
			id: functionId,
			name: 'double',
			ast: {
				name: 'double',
			},
		});
	});

	it('collects same-name functions as overloads when parameter signatures differ', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
				functions: [
					{ code: ['function convert', 'param int value', 'push value', 'functionEnd int'] },
					{ code: ['function convert', 'param float value', 'push value', 'functionEnd float'] },
				],
			},
			{ disableSharedMemory: true }
		);

		const intOverloadId = createFunctionId('convert', ['int']);
		const floatOverloadId = createFunctionId('convert', ['float']);
		expect(result.compiledFunctions![intOverloadId]).toMatchObject({
			id: intOverloadId,
			name: 'convert',
			signature: { parameters: ['int'], returns: ['int'] },
			ast: { name: 'convert' },
		});
		expect(result.compiledFunctions![floatOverloadId]).toMatchObject({
			id: floatOverloadId,
			name: 'convert',
			signature: { parameters: ['float'], returns: ['float'] },
			ast: { name: 'convert' },
		});
	});

	it('rejects same-name functions with duplicate parameter signatures', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
					functions: [
						{ code: ['function convert', 'param int value', 'push value', 'functionEnd int'] },
						{ code: ['function convert', 'param int input', 'push input', 'functionEnd int'] },
					],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.DUPLICATE_FUNCTION_SIGNATURE,
			line: expect.objectContaining({ instruction: 'function' }),
		});
	});

	it('rejects overload sets with mixed parameter arity', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
					functions: [
						{ code: ['function convert', 'param int value', 'push value', 'functionEnd int'] },
						{
							code: [
								'function convert',
								'param int value',
								'param int scale',
								'push value',
								'push scale',
								'add',
								'functionEnd int',
							],
						},
					],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.INVALID_FUNCTION_OVERLOAD_SET,
			line: expect.objectContaining({ instruction: 'function' }),
		});
	});

	it('rejects zero-parameter functions from forming overload sets', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
					functions: [
						{ code: ['function tick', 'functionEnd'] },
						{ code: ['function tick', 'param int value', 'push value', 'functionEnd int'] },
					],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.INVALID_FUNCTION_OVERLOAD_SET,
			line: expect.objectContaining({ instruction: 'function' }),
		});
	});

	it('resolves overloaded calls by exact stack operand types', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: {
					main: [{ code: ['module main', 'push 1', 'call consume', 'push 1.5', 'call consume', 'moduleEnd'] }],
				},
				functions: [
					{ code: ['function consume', 'param int value', 'functionEnd'] },
					{ code: ['function consume', 'param float value', 'functionEnd'] },
				],
			},
			{ disableSharedMemory: true }
		);

		const intOverloadId = createFunctionId('consume', ['int']);
		const floatOverloadId = createFunctionId('consume', ['float']);
		expect(result.compiledFunctions![intOverloadId].wasmIndex).not.toBe(
			result.compiledFunctions![floatOverloadId].wasmIndex
		);
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

	it('rejects exported overloaded functions during semantic metadata collection', () => {
		let thrownError: unknown;

		try {
			compile(
				{
					...emptyCompileInput,
					entries: { main: [{ code: ['module main', 'moduleEnd'], projectBlockId: 10 }] },
					functions: [
						{ code: ['function convert', '#export convertInt', 'param int value', 'functionEnd'], projectBlockId: 20 },
						{ code: ['function convert', 'param float value', 'functionEnd'], projectBlockId: 21 },
					],
				},
				{ disableSharedMemory: true }
			);
		} catch (error) {
			thrownError = error;
		}

		expect(serializeDiagnostic(thrownError)).toMatchObject({
			code: ErrorCode.OVERLOADED_FUNCTION_EXPORT_UNSUPPORTED,
			line: expect.objectContaining({ instruction: '#export' }),
			context: expect.objectContaining({ projectBlockId: 20 }),
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

	it('marks exported functions as used roots during metadata collection', () => {
		const result = compile(
			{
				...emptyCompileInput,
				entries: { main: [{ code: ['module main', 'moduleEnd'] }] },
				functions: [{ code: ['function externallyCallable', '#export externallyCallable', 'functionEnd'] }],
			},
			{ disableSharedMemory: true }
		);

		expect(result.compiledFunctions![createFunctionId('externallyCallable', [])].used).toBe(true);
	});
});

describe('compile module layout', () => {
	it('keeps memory layout stable when module execution order changes', async () => {
		const alphaModule = {
			code: ['module alpha', 'int output 0', 'push &output', 'push 1', 'store', 'moduleEnd'],
		};
		const betaModule = {
			code: ['module beta', 'int scratch 0', 'push &alpha:output', 'push 2', 'store', 'moduleEnd'],
		};

		const alphaThenBeta = compile(
			{
				...emptyCompileInput,
				entries: { main: [alphaModule, betaModule] },
			},
			{ disableSharedMemory: true }
		);
		const betaThenAlpha = compile(
			{
				...emptyCompileInput,
				entries: { main: [betaModule, alphaModule] },
			},
			{ disableSharedMemory: true }
		);

		expect(betaThenAlpha.compiledModules.alpha.memoryMap.output.byteAddress).toBe(
			alphaThenBeta.compiledModules.alpha.memoryMap.output.byteAddress
		);
		expect(betaThenAlpha.compiledModules.beta.memoryMap.scratch.byteAddress).toBe(
			alphaThenBeta.compiledModules.beta.memoryMap.scratch.byteAddress
		);
		expect(alphaThenBeta.compiledModules.alpha.index).toBe(0);
		expect(alphaThenBeta.compiledModules.beta.index).toBe(1);
		expect(betaThenAlpha.compiledModules.beta.index).toBe(0);
		expect(betaThenAlpha.compiledModules.alpha.index).toBe(1);

		const alphaFirstRuntime = await instantiateCompileResult(alphaThenBeta.codeBuffer);
		alphaFirstRuntime.exports.initDefaults();
		alphaFirstRuntime.exports.main();
		const alphaFirstMemory = new Int32Array(alphaFirstRuntime.memory.buffer);
		const outputWordAddress = alphaThenBeta.compiledModules.alpha.memoryMap.output.wordAlignedAddress;
		expect(alphaFirstMemory[outputWordAddress]).toBe(2);

		const betaFirstRuntime = await instantiateCompileResult(betaThenAlpha.codeBuffer);
		betaFirstRuntime.exports.initDefaults();
		betaFirstRuntime.exports.main();
		const betaFirstMemory = new Int32Array(betaFirstRuntime.memory.buffer);
		expect(betaFirstMemory[outputWordAddress]).toBe(1);
	});
});
