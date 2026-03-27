import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticConstants(line: AST[number], context: CompilationContext) {
	if (!line.arguments[0]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
	}

	if (line.arguments[0].type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
	}

	if (context.blockStack.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.CONSTANTS,
	});

	context.namespace.moduleName = line.arguments[0].value;
	context.codeBlockId = line.arguments[0].value;
	context.codeBlockType = 'constants';
}
