import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

/**
 * Instruction compiler for `constants`.
 */
const constants: InstructionCompiler = withValidation(
	{
		allowedInConstantsBlocks: true,
	},
	(line, context) => {
		if (!line.arguments[0]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
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

		return context;
	}
);

export default constants;
