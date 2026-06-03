import type { CompilationContext, CompilerASTLine, NormalizedLine } from '@8f4e/compiler-spec';
import { isMemoryDeclarationLine } from '@8f4e/compiler-spec';
import normalizeCall from './call';
import normalizeClampAddress from './clampAddress';
import normalizeConst from './const';
import normalizeDefault from './default';
import normalizeLocalVariableAccess from './localVariable';
import normalizeLoop from './loop';
import normalizeMap from './map';
import normalizeMemoryCopy from './memoryCopy';
import normalizeMemoryDeclaration from './memoryDeclaration';
import normalizePush from './push';

const instructionNormalizers = {
	call: normalizeCall,
	clampAddress: normalizeClampAddress,
	clampGlobalAddress: normalizeClampAddress,
	clampModuleAddress: normalizeClampAddress,
	const: normalizeConst,
	default: normalizeDefault,
	localSet: normalizeLocalVariableAccess,
	loop: normalizeLoop,
	map: normalizeMap,
	memoryCopy: normalizeMemoryCopy,
	push: normalizePush,
} as const;

/**
 * Dispatches line-specific semantic normalization before analysis and codegen.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export default function dispatchNormalization<TLine extends CompilerASTLine>(
	line: TLine,
	context: CompilationContext
): NormalizedLine<TLine> {
	const normalizer = instructionNormalizers[line.instruction as keyof typeof instructionNormalizers];
	if (normalizer) {
		return normalizer(line as never, context) as NormalizedLine<TLine>;
	}

	if (isMemoryDeclarationLine(line)) {
		return normalizeMemoryDeclaration(line as never, context) as NormalizedLine<TLine>;
	}

	return line as NormalizedLine<TLine>;
}
