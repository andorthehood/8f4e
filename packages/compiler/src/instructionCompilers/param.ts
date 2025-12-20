import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const param: InstructionCompiler = withValidation(
	{
		scope: 'function',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
	},
	(line, context) => {
		// Validate param comes immediately after function (before any non-param locals or bytecode)
		//
		// Parameters must be declared before any other function body code:
		// - Parameters are registered as locals at indices 0, 1, 2, etc. in order
		// - The 'local' instruction also registers locals but should come after all params
		// - Other instructions generate bytecode in loopSegmentByteCode
		//
		// We validate this by checking:
		// 1. localCount > paramCount: means a non-param local was declared (via 'local' instruction)
		// 2. loopSegmentByteCode.length > 0: means other instructions have already run
		//
		// If either is true, we're past the param declaration phase and should error.
		const paramCount = context.currentFunctionSignature?.parameters.length || 0;
		const localCount = Object.keys(context.namespace.locals).length;

		if (localCount > paramCount || context.loopSegmentByteCode.length > 0) {
			throw getError(ErrorCode.PARAM_AFTER_FUNCTION_BODY, line, context);
		}

		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type !== ArgumentType.IDENTIFIER || line.arguments[1].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		const paramType = line.arguments[0].value;
		const paramName = line.arguments[1].value;

		if (paramType !== 'int' && paramType !== 'float') {
			throw getError(ErrorCode.INVALID_FUNCTION_SIGNATURE, line, context);
		}

		// Check for duplicate parameter names
		if (context.namespace.locals[paramName] !== undefined) {
			throw getError(ErrorCode.DUPLICATE_PARAMETER_NAME, line, context);
		}

		// Register parameter as a local variable with the given name
		// Parameters get local indices starting from 0
		const paramIndex = Object.keys(context.namespace.locals).length;

		context.namespace.locals[paramName] = {
			isInteger: paramType === 'int',
			index: paramIndex,
		};

		// Add parameter type to the function signature being built
		context.currentFunctionSignature!.parameters.push(paramType);

		if (context.currentFunctionSignature!.parameters.length > 8) {
			throw getError(ErrorCode.FUNCTION_SIGNATURE_OVERFLOW, line, context);
		}

		return context;
	}
);

export default param;

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;
	const compile = (await import('../index')).default;

	const defaultOptions = {
		startingMemoryWordAddress: 1,
		environmentExtensions: {
			constants: {},
			ignoredKeywords: [],
		},
		memorySizeBytes: 65536,
		includeAST: true,
	};

	describe('Param Instruction', () => {
		test('should allow accessing parameters in declaration order', () => {
			const functions = [
				{
					code: ['function add', 'param int x', 'param int y', 'localGet x', 'localGet y', 'add', 'functionEnd int'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.add).toBeDefined();
			expect(result.compiledFunctions!.add.signature.parameters).toEqual(['int', 'int']);
			expect(result.compiledFunctions!.add.signature.returns).toEqual(['int']);
		});

		test('should allow accessing parameters in different order', () => {
			const functions = [
				{
					code: ['function subtract', 'param int x', 'param int y', 'localGet y', 'localGet x', 'sub', 'functionEnd int'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.subtract).toBeDefined();
			expect(result.compiledFunctions!.subtract.signature.parameters).toEqual(['int', 'int']);
		});

		test('should allow accessing only some parameters', () => {
			const functions = [
				{
					code: [
						'function useFirst',
						'param int x',
						'param int unused',
						'localGet x',
						'push 2',
						'mul',
						'functionEnd int',
					],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.useFirst).toBeDefined();
			expect(result.compiledFunctions!.useFirst.signature.parameters).toEqual(['int', 'int']);
		});

		test('should allow accessing the same parameter multiple times', () => {
			const functions = [
				{
					code: ['function square', 'param int x', 'localGet x', 'localGet x', 'mul', 'functionEnd int'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.square).toBeDefined();
			expect(result.compiledFunctions!.square.signature.parameters).toEqual(['int']);
		});

		test('should work with named parameters for improved readability', () => {
			const functions = [
				{
					code: [
						'function calculateArea',
						'param int width',
						'param int height',
						'localGet width',
						'localGet height',
						'mul',
						'functionEnd int',
					],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.calculateArea).toBeDefined();
			expect(result.compiledFunctions!.calculateArea.signature.parameters).toEqual(['int', 'int']);
		});

		test('should work with local variables declared after params', () => {
			const functions = [
				{
					code: [
						'function addWithLocal',
						'param int x',
						'param int y',
						'local int temp',
						'localGet x',
						'localGet y',
						'add',
						'localSet temp',
						'localGet temp',
						'functionEnd int',
					],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.addWithLocal).toBeDefined();
			expect(result.compiledFunctions!.addWithLocal.signature.parameters).toEqual(['int', 'int']);
		});

		test('should work with mixed int and float parameters', () => {
			const functions = [
				{
					code: [
						'function mixedParams',
						'param int intVal',
						'param float floatVal',
						'localGet intVal',
						'castToFloat',
						'localGet floatVal',
						'mul',
						'functionEnd float',
					],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.mixedParams).toBeDefined();
			expect(result.compiledFunctions!.mixedParams.signature.parameters).toEqual(['int', 'float']);
		});

		test('should reject param instruction outside function', () => {
			const modules = [
				{
					code: ['module test', 'param int x', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions)).toThrow();
		});

		test('should reject param instruction after other function body instructions', () => {
			const functions = [
				{
					code: ['function invalid', 'push 1', 'param int x', 'functionEnd int'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});

		test('should reject param instruction with invalid type', () => {
			const functions = [
				{
					code: ['function invalid', 'param invalidType x', 'functionEnd'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});

		test('should reject param instruction with missing arguments', () => {
			const functions = [
				{
					code: ['function invalid', 'param int', 'functionEnd'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});

		test('should reject more than 8 parameters', () => {
			const functions = [
				{
					code: [
						'function tooMany',
						'param int p1',
						'param int p2',
						'param int p3',
						'param int p4',
						'param int p5',
						'param int p6',
						'param int p7',
						'param int p8',
						'param int p9',
						'functionEnd',
					],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});

		test('should work with function that has no parameters', () => {
			const functions = [
				{
					code: ['function noParams', 'push 42', 'functionEnd int'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			const result = compile(modules, defaultOptions, functions);

			expect(result.compiledFunctions!.noParams).toBeDefined();
			expect(result.compiledFunctions!.noParams.signature.parameters).toEqual([]);
		});

		test('should reject param after local (param must come before local)', () => {
			// This test ensures param can only come immediately after function, not after local
			const functions = [
				{
					code: ['function invalid', 'local int temp', 'param int x', 'functionEnd'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			// This should fail because param must come before local
			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});

		test('should reject duplicate parameter names', () => {
			const functions = [
				{
					code: ['function invalid', 'param int x', 'param int x', 'functionEnd'],
				},
			];

			const modules = [
				{
					code: ['module test', 'moduleEnd'],
				},
			];

			expect(() => compile(modules, defaultOptions, functions)).toThrow();
		});
	});
}
