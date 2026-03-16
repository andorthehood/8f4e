import type { ParsedDirectiveRecord } from '~/types';
import type { ResolvedRuntimeDirectives } from './types';
import type { CodeError } from '~/types';

export interface RuntimeDirectiveResolutionResult {
	resolved: ResolvedRuntimeDirectives;
	errors: CodeError[];
}

/**
 * Scans all code blocks in project order for runtime directives.
 *
 * Expects `parsedDirectives` to be populated by the central derivation pass.
 *
 * Rules:
 * - Duplicate identical `~sampleRate` values are allowed.
 * - Conflicting `~sampleRate` values produce a structured error.
 * - Invalid or missing arguments produce structured errors.
 *
 * @param codeBlocks - Array of code blocks to scan (in project order)
 */
export function resolveRuntimeDirectives(
	codeBlocks: { parsedDirectives: ParsedDirectiveRecord[]; id?: string }[]
): RuntimeDirectiveResolutionResult {
	const errors: CodeError[] = [];

	let resolvedSampleRate: number | undefined;

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex++) {
		const block = codeBlocks[blockIndex];
		// Use the block's stable id when available, otherwise fall back to array index
		const codeBlockId: string | number = block.id ?? blockIndex;

		const runtimeDirectives = block.parsedDirectives.filter(d => d.prefix === '~');

		for (const directive of runtimeDirectives) {
			const lineIndex = directive.rawRow;

			if (directive.name === 'sampleRate') {
				if (directive.args.length === 0) {
					errors.push({
						lineNumber: lineIndex,
						message: '~sampleRate requires a numeric argument',
						codeBlockId,
					});
					continue;
				}

				const value = Number(directive.args[0]);
				if (!Number.isFinite(value) || value <= 0) {
					errors.push({
						lineNumber: lineIndex,
						message: `~sampleRate: invalid value '${directive.args[0]}' (must be a positive number)`,
						codeBlockId,
					});
					continue;
				}

				if (resolvedSampleRate === undefined) {
					resolvedSampleRate = value;
				} else if (resolvedSampleRate !== value) {
					errors.push({
						lineNumber: lineIndex,
						message: `~sampleRate: conflicting values ${resolvedSampleRate} and ${value}`,
						codeBlockId,
					});
				}
				// Duplicate identical values are allowed — no error
			}
		}
	}

	return {
		resolved: resolvedSampleRate !== undefined ? { sampleRate: resolvedSampleRate } : {},
		errors,
	};
}
