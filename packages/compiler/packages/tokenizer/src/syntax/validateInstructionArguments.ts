import {
	ArgumentType,
	FUNCTION_TYPE_IDENTIFIERS,
	SCALAR_TYPE_IDENTIFIERS,
	getInstructionSpec,
} from '@8f4e/compiler-spec';

import isConstantName from './isConstantName';
import isArrayDeclarationInstruction from './isArrayDeclarationInstruction';
import isMemoryDeclarationInstruction from './isMemoryDeclarationInstruction';
import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

import type { Argument, SourceArgumentsSpec, SourceArgumentShapeRule } from '@8f4e/compiler-spec';

const supportedScalarTypeIdentifiers: ReadonlySet<string> = new Set(SCALAR_TYPE_IDENTIFIERS);
const supportedFunctionTypeIdentifiers: ReadonlySet<string> = new Set(FUNCTION_TYPE_IDENTIFIERS);
const supportedIfResultTypeIdentifiers = new Set(['int', 'float']);

function getInstructionArgumentSpec(instruction: string): SourceArgumentsSpec | undefined {
	if (isArrayDeclarationInstruction(instruction)) {
		return {
			minArguments: 2,
			argumentTypes: ['identifier', 'compileTimeValue'],
		};
	}

	if (isMemoryDeclarationInstruction(instruction)) {
		return undefined;
	}

	return getInstructionSpec(instruction)?.sourceArguments;
}

function isCompileTimeValue(argument: Argument): boolean {
	return (
		argument.type === ArgumentType.LITERAL ||
		argument.type === ArgumentType.IDENTIFIER ||
		argument.type === ArgumentType.COMPILE_TIME_EXPRESSION
	);
}

function validateArgumentShape(argument: Argument, rule: SourceArgumentShapeRule, instruction: string): void {
	const invalid = (message: string) => {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, message);
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
		case 'nonNegativeCompileTimeValue':
			if (!isCompileTimeValue(argument) || (argument.type === ArgumentType.LITERAL && argument.value < 0)) {
				invalid(`Invalid argument for ${instruction}: expected non-negative compile-time value.`);
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
			if (argument.type !== ArgumentType.IDENTIFIER || !supportedScalarTypeIdentifiers.has(argument.value)) {
				invalid(`Invalid argument for ${instruction}: expected type identifier (int, float, or float64).`);
			}
			return;
		case 'functionTypeIdentifier':
			if (argument.type !== ArgumentType.IDENTIFIER || !supportedFunctionTypeIdentifiers.has(argument.value)) {
				invalid(`Invalid argument for ${instruction}: expected function type identifier.`);
			}
			return;
		case 'ifResultType':
			if (argument.type !== ArgumentType.IDENTIFIER || !supportedIfResultTypeIdentifiers.has(argument.value)) {
				invalid(`Invalid argument for ${instruction}: expected result type (int or float).`);
			}
			return;
		case 'regionReference':
			if (
				argument.type !== ArgumentType.IDENTIFIER &&
				(argument.type !== ArgumentType.LITERAL || !argument.isInteger || argument.value < 0)
			) {
				invalid(`Invalid argument for ${instruction}: expected region identifier or non-negative integer index.`);
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
		throw new SyntaxRulesError(SyntaxErrorCode.MISSING_ARGUMENT, `Missing required argument for ${instruction}.`);
	}

	if (spec.maxArguments !== undefined && args.length > spec.maxArguments) {
		throw new SyntaxRulesError(SyntaxErrorCode.INVALID_ARGUMENT, `Too many arguments for ${instruction}.`);
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
			validateArgumentShape(argument, spec.argumentTypes[i], instruction);
		}
		if (isArrayDeclarationInstruction(instruction)) {
			for (let i = spec.argumentTypes.length; i < args.length; i++) {
				validateArgumentShape(args[i], 'compileTimeValue', instruction);
			}
		}
		return;
	}

	for (let i = 0; i < args.length; i++) {
		validateArgumentShape(args[i], spec.argumentTypes, instruction);
	}
}
