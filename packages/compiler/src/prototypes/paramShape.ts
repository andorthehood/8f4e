import {
	ArgumentType,
	type CompilerDiagnosticContext,
	ErrorCode,
	FUNCTION_TYPE_IDENTIFIERS,
	type FunctionParamShapeExpansion,
	type FunctionSignature,
	type FunctionValueType,
	type MemoryDeclarationLine,
	type ParamShapeLine,
	type ValidatedFunctionAST,
	type ValidatedPrototypeAST,
} from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

const functionTypeIdentifiers = new Set<string>(FUNCTION_TYPE_IDENTIFIERS);

function getAstDiagnosticContext(ast: ValidatedFunctionAST): CompilerDiagnosticContext {
	return {
		codeBlockType: ast.type,
		...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
	};
}

function getMemoryDeclarationId(
	line: MemoryDeclarationLine,
	paramShapeLine: ParamShapeLine,
	context: CompilerDiagnosticContext
) {
	const idArgument = line.arguments[0];
	if (idArgument.type !== ArgumentType.IDENTIFIER || idArgument.referenceKind !== 'plain') {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, paramShapeLine, context);
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

function getParamType(line: MemoryDeclarationLine, paramShapeLine: ParamShapeLine, context: CompilerDiagnosticContext) {
	const declarationType = line.instruction.endsWith('[]') ? line.instruction.slice(0, -2) : line.instruction;
	const normalizedType = declarationType === 'int32' ? 'int' : declarationType;
	const pointerDepth = getPointerDepth(normalizedType);
	const expandedPointerDepth = pointerDepth + 1;

	// Function value types currently stop at double pointers; paramShape would need one extra layer
	// for every shaped declaration, so deeper prototype pointer declarations are rejected for now.
	if (expandedPointerDepth > 2) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, paramShapeLine, context);
	}

	const baseType = normalizedType.replace(/\*+$/, '');
	const paramType = `${baseType}${'*'.repeat(expandedPointerDepth)}`;
	if (!functionTypeIdentifiers.has(paramType)) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, paramShapeLine, context);
	}

	return paramType as FunctionValueType;
}

export function getParamShapeExpansion(
	line: ParamShapeLine,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>,
	context: CompilerDiagnosticContext
): FunctionParamShapeExpansion {
	const prototypeId = line.arguments[0].value;
	const prototype = prototypeShapes[prototypeId];
	if (!prototype) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context, { identifier: prototypeId });
	}

	return {
		lineNumber: line.lineNumber,
		parameters: prototype.memoryDeclarationLines.map(declarationLine => ({
			type: getParamType(declarationLine, line, context),
			name: getMemoryDeclarationId(declarationLine, line, context),
		})),
	};
}

export function getFunctionParamShapeExpansions(
	ast: ValidatedFunctionAST,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>
): FunctionParamShapeExpansion[] {
	return ast.lines
		.filter((line): line is ParamShapeLine => line.instruction === 'paramShape')
		.map(line => getParamShapeExpansion(line, prototypeShapes, getAstDiagnosticContext(ast)));
}

export function getEffectiveFunctionSignature(
	ast: ValidatedFunctionAST,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>
): FunctionSignature {
	const parameters: FunctionSignature['parameters'] = [];

	for (const line of ast.lines) {
		if (line.instruction === 'param') {
			parameters.push(line.arguments[0].value as FunctionValueType);
		}
		if (line.instruction === 'paramShape') {
			parameters.push(
				...getParamShapeExpansion(line, prototypeShapes, getAstDiagnosticContext(ast)).parameters.map(
					parameter => parameter.type
				)
			);
		}
	}

	return {
		parameters,
		returns: ast.functionEndLine.arguments.map(argument => argument.value as FunctionSignature['returns'][number]),
	};
}
