import isConstantName from './isConstantName';
import { ArgumentType, type Argument } from './parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

type ArgumentShapeRule =
	| 'identifier'
	| 'constantIdentifier'
	| 'literal'
	| 'nonNegativeIntegerLiteral'
	| 'compileTimeValue'
	| 'mapValue'
	| 'typeIdentifier';

type InstructionArgumentSpec = {
	minArguments?: number;
	argumentTypes?: ArgumentShapeRule[] | ArgumentShapeRule;
};

const supportedTypeIdentifiers = new Set(['int', 'float', 'float64']);
const bufferDeclarationInstructionPattern =
	/^(?:float(?:\*{1,2})?|float64(?:\*{1,2})?|int(?:8u?|16u?|32|\*{1,2})?)\[\]$/;

const instructionArgumentSpecs: Partial<Record<string, InstructionArgumentSpec>> = {
	push: { minArguments: 1 },
	branch: { minArguments: 1, argumentTypes: ['literal'] },
	branchIfTrue: { minArguments: 1, argumentTypes: ['literal'] },
	branchIfUnchanged: { minArguments: 1, argumentTypes: ['literal'] },
	wasm: { minArguments: 1, argumentTypes: ['literal'] },
	block: { minArguments: 1, argumentTypes: ['identifier'] },
	local: { minArguments: 2, argumentTypes: ['typeIdentifier', 'identifier'] },
	param: { minArguments: 2, argumentTypes: ['typeIdentifier', 'identifier'] },
	localGet: { minArguments: 1, argumentTypes: ['identifier'] },
	localSet: { minArguments: 1, argumentTypes: ['identifier'] },
	function: { minArguments: 1, argumentTypes: ['identifier'] },
	functionEnd: { argumentTypes: 'typeIdentifier' },
	call: { minArguments: 1, argumentTypes: ['identifier'] },
	mapBegin: { minArguments: 1, argumentTypes: ['typeIdentifier'] },
	mapEnd: { minArguments: 1, argumentTypes: ['typeIdentifier'] },
	map: { minArguments: 2, argumentTypes: ['mapValue', 'mapValue'] },
	default: { minArguments: 1, argumentTypes: ['compileTimeValue'] },
	storeBytes: { minArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	module: { minArguments: 1, argumentTypes: ['identifier'] },
	constants: { minArguments: 1, argumentTypes: ['identifier'] },
	use: { minArguments: 1, argumentTypes: ['identifier'] },
	const: { minArguments: 2, argumentTypes: ['constantIdentifier', 'compileTimeValue'] },
	init: { minArguments: 2, argumentTypes: ['identifier', 'compileTimeValue'] },
};

function getInstructionArgumentSpec(instruction: string): InstructionArgumentSpec | undefined {
	if (bufferDeclarationInstructionPattern.test(instruction)) {
		return {
			minArguments: 2,
			argumentTypes: ['identifier', 'compileTimeValue'],
		};
	}

	return instructionArgumentSpecs[instruction];
}

function isCompileTimeValue(argument: Argument): boolean {
	return (
		argument.type === ArgumentType.LITERAL ||
		argument.type === ArgumentType.IDENTIFIER ||
		argument.type === ArgumentType.COMPILE_TIME_EXPRESSION
	);
}

function validateArgumentShape(argument: Argument, rule: ArgumentShapeRule, instruction: string, index: number): void {
	const invalid = (message: string) => {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, message, {
			instruction,
			argumentIndex: index,
			rule,
		});
	};

	switch (rule) {
		case 'identifier':
			if (argument.type !== ArgumentType.IDENTIFIER) {
				invalid(`Invalid argument for ${instruction}: expected identifier.`);
			}
			return;
		case 'constantIdentifier':
			if (argument.type !== ArgumentType.IDENTIFIER || !isConstantName(argument.value)) {
				invalid(`Invalid argument for ${instruction}: expected constant identifier.`);
			}
			return;
		case 'literal':
			if (argument.type !== ArgumentType.LITERAL) {
				invalid(`Invalid argument for ${instruction}: expected literal.`);
			}
			return;
		case 'nonNegativeIntegerLiteral':
			if (argument.type !== ArgumentType.LITERAL || !argument.isInteger || argument.value < 0) {
				invalid(`Invalid argument for ${instruction}: expected non-negative integer literal.`);
			}
			return;
		case 'compileTimeValue':
			if (!isCompileTimeValue(argument)) {
				invalid(`Invalid argument for ${instruction}: expected compile-time value.`);
			}
			return;
		case 'mapValue':
			if (argument.type === ArgumentType.STRING_LITERAL) {
				if (argument.value.length !== 1) {
					invalid(`Invalid argument for ${instruction}: string literals must contain exactly one character.`);
				}
				return;
			}
			if (!isCompileTimeValue(argument)) {
				invalid(
					`Invalid argument for ${instruction}: expected literal, compile-time value, or single-character string literal.`
				);
			}
			return;
		case 'typeIdentifier':
			if (argument.type !== ArgumentType.IDENTIFIER || !supportedTypeIdentifiers.has(argument.value)) {
				invalid(`Invalid argument for ${instruction}: expected type identifier (int, float, or float64).`);
			}
			return;
	}
}

export default function validateInstructionArguments(instruction: string, args: Argument[]): void {
	const spec = getInstructionArgumentSpec(instruction);
	if (!spec) {
		return;
	}

	if (spec.minArguments !== undefined && args.length < spec.minArguments) {
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, `Missing required argument for ${instruction}.`, {
			instruction,
			minArguments: spec.minArguments,
			actualArguments: args.length,
		});
	}

	if (!spec.argumentTypes) {
		return;
	}

	if (Array.isArray(spec.argumentTypes)) {
		for (let i = 0; i < spec.argumentTypes.length; i++) {
			const argument = args[i];
			if (!argument) {
				return;
			}
			validateArgumentShape(argument, spec.argumentTypes[i], instruction, i);
		}
		return;
	}

	for (let i = 0; i < args.length; i++) {
		validateArgumentShape(args[i], spec.argumentTypes, instruction, i);
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('validateInstructionArguments', () => {
		it('enforces missing arguments for known instruction arity', () => {
			expect(() => validateInstructionArguments('push', [])).toThrowError(SyntaxRulesError);
			expect(() =>
				validateInstructionArguments('map', [{ type: ArgumentType.LITERAL, value: 1, isInteger: true }])
			).toThrowError(SyntaxRulesError);
		});

		it('accepts compile-time values for default', () => {
			expect(() =>
				validateInstructionArguments('default', [
					{ type: ArgumentType.COMPILE_TIME_EXPRESSION, lhs: 'SIZE', operator: '*', rhs: '2' },
				])
			).not.toThrow();
		});

		it('rejects non-single-character string literals in map', () => {
			expect(() =>
				validateInstructionArguments('map', [
					{ type: ArgumentType.STRING_LITERAL, value: 'AB' },
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
				])
			).toThrowError(SyntaxRulesError);
		});

		it('rejects unsupported type identifiers', () => {
			expect(() =>
				validateInstructionArguments('param', [
					{ type: ArgumentType.IDENTIFIER, value: 'bool' },
					{ type: ArgumentType.IDENTIFIER, value: 'x' },
				])
			).toThrowError(SyntaxRulesError);
		});

		it('rejects non-constant identifiers for const declarations', () => {
			expect(() =>
				validateInstructionArguments('const', [
					{ type: ArgumentType.IDENTIFIER, value: 'foo' },
					{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
				])
			).toThrowError(SyntaxRulesError);
		});

		it('validates buffer declaration argument shapes', () => {
			expect(() =>
				validateInstructionArguments('int[]', [
					{ type: ArgumentType.IDENTIFIER, value: 'values' },
					{ type: ArgumentType.LITERAL, value: 8, isInteger: true },
				])
			).not.toThrow();
		});

		it('does not treat unsupported declarations as buffer declarations', () => {
			expect(() =>
				validateInstructionArguments('int16*[]', [
					{ type: ArgumentType.IDENTIFIER, value: 'values' },
					{ type: ArgumentType.LITERAL, value: 8, isInteger: true },
				])
			).not.toThrow();
		});
	});
}
