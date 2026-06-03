import type { CompilationContext, CompilerASTLine } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../../compilerError';
import { getClampAccessByteWidth, getClampedAddressStackItem, getModuleAddressRange } from '../../utils/addressClamp';
import { consume, produce } from './stack';
import type { InstructionAnalysisResult } from './types';

/**
 * Consumes an address-like value and produces the stack item representing the clamped address range.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The stack-analysis result for the instruction.
 */
export function analyzeClampAddress(line: CompilerASTLine, context: CompilationContext): InstructionAnalysisResult {
	const consumed = consume(context, 1);
	const accessByteWidth = getClampAccessByteWidth(line);
	const range =
		line.instruction === 'clampAddress'
			? consumed[0].kind === 'address'
				? (consumed[0].address.clampRange ?? consumed[0].address.safeRange)
				: undefined
			: line.instruction === 'clampModuleAddress'
				? getModuleAddressRange(context)
				: undefined;

	if (line.instruction === 'clampAddress' && !range) {
		throw getError(ErrorCode.ADDRESS_RANGE_REQUIRED, line, context);
	}

	if (range && range.safeByteLength < accessByteWidth) {
		throw getError(ErrorCode.ADDRESS_RANGE_TOO_SMALL, line, context);
	}

	const produced = [getClampedAddressStackItem(consumed[0], range, accessByteWidth)];
	produce(context, produced);
	return { consumed, produced };
}
