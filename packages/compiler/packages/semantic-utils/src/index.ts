import type { CompilationContext, SemanticInstructionLine } from '@8f4e/language-spec';
import applySemanticInstruction from './instructions';
import normalizeValueArguments from './normalizeValueArguments';

export * from './addressClamp';
export * from './blockStack';
export * from './createCompilationContext';
export { default as applySemanticInstruction } from './instructions';
export * from './mapValueKind';
export * from './memoryState';
export { default as dispatchNormalization } from './normalization';
export { default as normalizeClampAddress } from './normalization/clampAddress';
export * from './normalization/helpers';
export { default as normalizeValueArguments } from './normalizeValueArguments';
export * from './operandTypes';

/**
 * Normalizes and applies one semantic instruction using the shared semantic dispatcher.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns Nothing.
 */
export function applySemanticLine(line: SemanticInstructionLine, context: CompilationContext) {
	const normalizedLine = normalizeValueArguments(line, context);
	applySemanticInstruction(normalizedLine, context);
}
