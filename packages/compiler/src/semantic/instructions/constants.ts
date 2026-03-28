import { ErrorCode, getError } from '../../compilerError';
import { ArgumentType, BLOCK_TYPE, type AST, type CompilationContext } from '../../types';

export default function semanticConstants(line: AST[number], context: CompilationContext) {
	if (context.blockStack.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BLOCK_TYPE.CONSTANTS,
	});

	const moduleId = (line.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string }).value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = 'constants';
}
