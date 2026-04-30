import isConstantName from './isConstantName';
import isArrayDeclarationInstruction from './isArrayDeclarationInstruction';
import { FUNCTION_TYPE_IDENTIFIERS, SCALAR_TYPE_IDENTIFIERS } from './functionTypeIdentifiers';
import { ArgumentType, type Argument } from './parseArgument';
import { SyntaxErrorCode, SyntaxRulesError } from './syntaxError';

type ArgumentShapeRule =
	| 'identifier'
	| 'constantIdentifier'
	| 'literal'
	| 'nonNegativeIntegerLiteral'
	| 'compileTimeValue'
	| 'mapValue'
	| 'typeIdentifier'
	| 'functionTypeIdentifier'
	| 'ifResultType';

type InstructionArgumentSpec = {
	minArguments?: number;
	maxArguments?: number;
	argumentTypes?: ArgumentShapeRule[] | ArgumentShapeRule;
};

const supportedScalarTypeIdentifiers: ReadonlySet<string> = new Set(SCALAR_TYPE_IDENTIFIERS);
const supportedFunctionTypeIdentifiers: ReadonlySet<string> = new Set(FUNCTION_TYPE_IDENTIFIERS);
const supportedIfResultTypeIdentifiers = new Set(['int', 'float']);

const instructionArgumentSpecs: Partial<Record<string, InstructionArgumentSpec>> = {
	push: { minArguments: 1 },
	branch: { minArguments: 1, argumentTypes: ['literal'] },
	branchIfTrue: { minArguments: 1, argumentTypes: ['literal'] },
	branchIfUnchanged: { minArguments: 1, argumentTypes: ['literal'] },
	exitIfTrue: { maxArguments: 0 },
	wasm: { minArguments: 1, argumentTypes: ['literal'] },
	block: { maxArguments: 0 },
	blockEnd: { maxArguments: 1, argumentTypes: 'ifResultType' },
	local: { minArguments: 2, argumentTypes: ['functionTypeIdentifier', 'identifier'] },
	param: { minArguments: 2, argumentTypes: ['functionTypeIdentifier', 'identifier'] },
	localSet: { minArguments: 1, argumentTypes: ['identifier'] },
	function: { minArguments: 1, argumentTypes: ['identifier'] },
	functionEnd: { argumentTypes: 'functionTypeIdentifier' },
	call: { minArguments: 1, argumentTypes: ['identifier'] },
	mapBegin: { minArguments: 1, argumentTypes: ['typeIdentifier'] },
	mapEnd: { minArguments: 1, argumentTypes: ['typeIdentifier'] },
	map: { minArguments: 2, argumentTypes: ['mapValue', 'mapValue'] },
	default: { minArguments: 1, argumentTypes: ['compileTimeValue'] },
	storeBytes: { minArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	clampAddress: { maxArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	clampModuleAddress: { maxArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	clampGlobalAddress: { maxArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	loop: { argumentTypes: ['nonNegativeIntegerLiteral'] },
	loopIndex: { maxArguments: 0 },
	'#loopCap': { minArguments: 1, argumentTypes: ['nonNegativeIntegerLiteral'] },
	'#impure': { maxArguments: 0 },
	module: { minArguments: 1, argumentTypes: ['identifier'] },
	constants: { minArguments: 1, argumentTypes: ['identifier'] },
	use: { minArguments: 1, argumentTypes: ['identifier'] },
	const: {
		minArguments: 2,
		argumentTypes: ['constantIdentifier', 'compileTimeValue'],
	},
	init: { minArguments: 2, argumentTypes: ['identifier', 'compileTimeValue'] },
	if: { maxArguments: 0 },
	ifEnd: { maxArguments: 1, argumentTypes: 'ifResultType' },
};

function getInstructionArgumentSpec(instruction: string): InstructionArgumentSpec | undefined {
	if (isArrayDeclarationInstruction(instruction)) {
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

function validateArgumentShape(argument: Argument, rule: ArgumentShapeRule, instruction: string): void {
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
