import type { ParsedDirectiveRecord, CodeError } from '~/types';
import type { ResolvedRuntimeDirectives } from './types';

export interface RuntimeDirectiveResolutionResult {
	resolved: ResolvedRuntimeDirectives;
	errors: CodeError[];
}

export function resolveRuntimeDirectives(
	codeBlocks: { parsedDirectives: ParsedDirectiveRecord[]; id?: string }[]
): RuntimeDirectiveResolutionResult {
	const errors: CodeError[] = [];

	let resolvedSampleRate: number | undefined;

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex++) {
		const block = codeBlocks[blockIndex];
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
			}
		}
	}

	return {
		resolved: resolvedSampleRate !== undefined ? { sampleRate: resolvedSampleRate } : {},
		errors,
	};
}
