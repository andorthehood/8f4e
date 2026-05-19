import { BlockType } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';
import { assertCompilerDirectiveInPrologue } from '../semantic/compilerDirectives';

import type { ExportLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#export`.
 * Marks the current function as a WebAssembly export under the provided name.
 */
const exportFunction: InstructionCompiler<ExportLine> = function (line, context) {
	const isInFunctionBlock = context.blockStack.some(block => block.blockType === BlockType.FUNCTION);

	if (!isInFunctionBlock) {
		throw getError(ErrorCode.EXPORT_DIRECTIVE_INVALID_CONTEXT, line, context);
	}
	assertCompilerDirectiveInPrologue(line, context);

	if (context.currentFunctionExportName !== undefined) {
		throw getError(ErrorCode.DUPLICATE_EXPORT_NAME, line, context, {
			identifier: line.arguments[0].value,
		});
	}

	context.currentFunctionExportName = line.arguments[0].value;

	return context;
};

export default exportFunction;
