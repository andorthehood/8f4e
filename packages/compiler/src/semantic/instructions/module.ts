import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticModule(line: AST[number], context: CompilationContext) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.MODULE,
	});

	context.namespace.moduleName = line.arguments[0].value;
	context.codeBlockId = line.arguments[0].value;
	context.codeBlockType = 'module';
}
