import { ArgumentType } from './arguments';
import type {
	CompilerASTLine,
	MemoryDeclarationLine,
	ParamShapeLine,
	ValidatedFunctionAST,
	ValidatedPrototypeAST,
} from './ast';
import type { FunctionMetadata, FunctionParamShapeExpansion } from './compiled';
import { ErrorCode, getError } from './compilerError';
import type { CompilerDiagnosticContext } from './diagnostics';
import type { FunctionValueType } from './functionTypes';
import { isFunctionValueType } from './functionTypes';

function getAstDiagnosticContext(ast: ValidatedFunctionAST): CompilerDiagnosticContext {
	return {
		codeBlockType: ast.type,
		...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
	};
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

export function getPrototypeMemoryDeclarationId(
	line: MemoryDeclarationLine,
	sourceLine: CompilerASTLine,
	context: CompilerDiagnosticContext
): string {
	const idArgument = line.arguments[0];
	if (idArgument.type !== ArgumentType.IDENTIFIER || idArgument.referenceKind !== 'plain') {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, sourceLine, context);
	}

	return idArgument.value;
}

export function getParamType(
	line: MemoryDeclarationLine,
	sourceLine: CompilerASTLine,
	context: CompilerDiagnosticContext
): FunctionValueType {
	const declarationType = line.instruction.endsWith('[]') ? line.instruction.slice(0, -2) : line.instruction;
	const normalizedType = declarationType === 'int32' ? 'int' : declarationType;
	const pointerDepth = getPointerDepth(normalizedType);
	const expandedPointerDepth = pointerDepth + 1;

	if (expandedPointerDepth > 2) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, sourceLine, context);
	}

	const baseType = normalizedType.replace(/\*+$/, '');
	const paramType = `${baseType}${'*'.repeat(expandedPointerDepth)}`;
	if (!isFunctionValueType(paramType)) {
		throw getError(ErrorCode.PARAM_SHAPE_UNSUPPORTED_POINTER_DEPTH, sourceLine, context);
	}

	return paramType;
}

function getParamShapeExpansion(
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
			name: getPrototypeMemoryDeclarationId(declarationLine, line, context),
		})),
	};
}

export function getEffectiveFunctionMetadata(
	ast: ValidatedFunctionAST,
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>
): Pick<FunctionMetadata, 'signature' | 'paramShapeExpansions'> {
	const parameters: FunctionMetadata['signature']['parameters'] = [];
	const paramShapeExpansions: FunctionParamShapeExpansion[] = [];
	const context = getAstDiagnosticContext(ast);

	for (const line of ast.lines) {
		if (line.instruction === 'param') {
			parameters.push(line.arguments[0].value as FunctionValueType);
		}
		if (line.instruction === 'paramShape') {
			const expansion = getParamShapeExpansion(line, prototypeShapes, context);
			paramShapeExpansions.push(expansion);
			parameters.push(...expansion.parameters.map(parameter => parameter.type));
		}
	}

	return {
		signature: {
			parameters,
			returns: ast.functionEndLine.arguments.map(
				argument => argument.value as FunctionMetadata['signature']['returns'][number]
			),
		},
		...(paramShapeExpansions.length > 0 ? { paramShapeExpansions } : {}),
	};
}
