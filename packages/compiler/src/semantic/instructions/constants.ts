import {
	BlockType,
	compilerSourceBlockInstructionByType,
	type CompilationContext,
	type ConstantsLine,
} from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../../compilerError';

const constantsBlockType = compilerSourceBlockInstructionByType.constants.type;

export default function semanticConstants(line: ConstantsLine, context: CompilationContext) {
	if (context.blockStack.length > 0) {
		throw getError(ErrorCode.INSTRUCTION_MUST_BE_TOP_LEVEL, line, context);
	}

	context.blockStack.push({
		hasExpectedResult: false,
		expectedResultIsInteger: false,
		blockType: BlockType.CONSTANTS,
	});

	const moduleId = line.arguments[0].value;
	context.namespace.moduleName = moduleId;
	context.codeBlockId = moduleId;
	context.codeBlockType = constantsBlockType;
}
