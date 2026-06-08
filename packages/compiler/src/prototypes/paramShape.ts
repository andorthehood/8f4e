import {
	ArgumentType,
	type CompilerASTLines,
	ErrorCode,
	FUNCTION_TYPE_IDENTIFIERS,
	type FunctionSignature,
	type FunctionValueType,
	type MemoryDeclarationLine,
	type ParamLine,
	type ParamShapeLine,
	type ValidatedFunctionAST,
	type ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

const functionTypeIdentifiers = new Set<string>(FUNCTION_TYPE_IDENTIFIERS);

function createPlainIdentifier(value: string) {
	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'plain',
		scope: 'local',
	} as const;
}

function getMemoryDeclarationId(
	line: MemoryDeclarationLine,
	paramShapeLine: ParamShapeLine,
	ast: ValidatedFunctionAST
) {
	const idArgument = line.arguments[0];
	if (idArgument.type !== ArgumentType.IDENTIFIER || idArgument.referenceKind !== 'plain') {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, paramShapeLine, {
			codeBlockType: ast.type,
			...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
		});
	}

	return idArgument.value;
}

function getPointerDepth(type: string): number {
	if (type.endsWith('**')) {
		return 2;
	}
	if (type.endsWith('*')) {
		return 1;
	}
	return 0;
}

function getParamType(line: MemoryDeclarationLine, paramShapeLine: ParamShapeLine, ast: ValidatedFunctionAST) {
	const declarationType = line.instruction.endsWith('[]') ? line.instruction.slice(0, -2) : line.instruction;
	const normalizedType = declarationType === 'int32' ? 'int' : declarationType;
	const pointerDepth = getPointerDepth(normalizedType);
	const expandedPointerDepth = pointerDepth + 1;

	// Function value types currently stop at double pointers; paramShape would need one extra layer
	// for every shaped declaration, so deeper prototype pointer declarations are rejected for now.
	if (expandedPointerDepth > 2) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, paramShapeLine, {
			codeBlockType: ast.type,
			...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
		});
	}

	const baseType = normalizedType.replace(/\*+$/, '');
	const paramType = `${baseType}${'*'.repeat(expandedPointerDepth)}`;
	if (!functionTypeIdentifiers.has(paramType)) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, paramShapeLine, {
			codeBlockType: ast.type,
			...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
		});
	}

	return paramType as FunctionValueType;
}

function createParamLine(
	line: MemoryDeclarationLine,
	paramShapeLine: ParamShapeLine,
	ast: ValidatedFunctionAST
): ParamLine {
	const paramType = getParamType(line, paramShapeLine, ast);
	const paramName = getMemoryDeclarationId(line, paramShapeLine, ast);

	return {
		lineNumber: paramShapeLine.lineNumber,
		instruction: 'param',
		arguments: [createPlainIdentifier(paramType), createPlainIdentifier(paramName)],
	};
}

function expandParamShapeLine(
	line: ParamShapeLine,
	ast: ValidatedFunctionAST,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>
): readonly ParamLine[] {
	const prototypeId = line.arguments[0].value;
	const prototype = prototypeShapes[prototypeId];
	if (!prototype) {
		throw getError(
			ErrorCode.UNDECLARED_IDENTIFIER,
			line,
			{
				codeBlockType: ast.type,
				...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
			},
			{ identifier: prototypeId }
		);
	}

	return prototype.memoryDeclarationLines.map(declarationLine => createParamLine(declarationLine, line, ast));
}

function getFunctionSignature(lines: ValidatedFunctionAST['lines'], ast: ValidatedFunctionAST): FunctionSignature {
	return {
		parameters: lines
			.filter((line): line is ParamLine => line.instruction === 'param')
			.map(line => line.arguments[0].value as FunctionValueType),
		returns: ast.functionEndLine.arguments.map(argument => argument.value as FunctionSignature['returns'][number]),
	};
}

/**
 * Expands function `paramShape` instructions into ordinary `param` lines after prototype ASTs are known.
 *
 * @param ast - Function AST to expand.
 * @param prototypeShapes - Prototype ASTs indexed by id.
 * @returns Function AST whose signature and lines contain concrete params.
 */
export function expandFunctionParamShapes(
	ast: ValidatedFunctionAST,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>
): ValidatedFunctionAST {
	const lines: CompilerASTLines = [];
	for (const line of ast.lines) {
		if (line.instruction === 'paramShape') {
			lines.push(line);
			lines.push(...expandParamShapeLine(line, ast, prototypeShapes));
		} else {
			lines.push(line);
		}
	}

	return {
		...ast,
		lines,
		signature: getFunctionSignature(lines, ast),
	};
}
