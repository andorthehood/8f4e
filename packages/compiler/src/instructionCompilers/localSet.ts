import { localSet } from '@8f4e/compiler-wasm-utils';
import { ErrorCode } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';

import type { CodegenLocalSetLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `localSet`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const _localSet: InstructionCompiler<CodegenLocalSetLine> = (line: CodegenLocalSetLine, context) => {
	const operand = context.stack.pop()!;
	const local = context.locals[line.arguments[0].value]!;

	if (local.isInteger && !operand.isInteger) {
		throw getError(ErrorCode.ONLY_INTEGERS, line, context);
	}

	if (!local.isInteger && operand.isInteger) {
		throw getError(ErrorCode.ONLY_FLOATS, line, context);
	}

	return saveByteCode(context, localSet(local.index));
};

export default _localSet;
