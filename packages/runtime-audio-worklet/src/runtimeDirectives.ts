import type { CodeError, State, ParsedDirectiveRecord } from '@8f4e/editor';

const DEFAULT_SAMPLE_RATE = 48000;
const AUDIO_BUFFER_SIZE = 128;

function resolveAudioWorkletRuntimeSettingsFromBlocks(
	codeBlocks: Array<{ parsedDirectives: ParsedDirectiveRecord[]; id?: string | number }>
) {
	const errors: CodeError[] = [];
	let resolvedSampleRate: number | undefined;

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex++) {
		const block = codeBlocks[blockIndex];
		const codeBlockId: string | number = block.id ?? blockIndex;

		for (const directive of block.parsedDirectives) {
			if (directive.prefix !== '~' || directive.name !== 'sampleRate') {
				continue;
			}

			if (directive.args.length === 0) {
				errors.push({
					lineNumber: directive.rawRow,
					message: '~sampleRate requires a numeric argument',
					codeBlockId,
				});
				continue;
			}

			const value = Number(directive.args[0]);
			if (!Number.isFinite(value) || value <= 0) {
				errors.push({
					lineNumber: directive.rawRow,
					message: `~sampleRate: invalid value '${directive.args[0]}' (must be a positive number)`,
					codeBlockId,
				});
				continue;
			}

			if (resolvedSampleRate === undefined) {
				resolvedSampleRate = value;
				continue;
			}

			if (resolvedSampleRate !== value) {
				errors.push({
					lineNumber: directive.rawRow,
					message: `~sampleRate: conflicting values ${resolvedSampleRate} and ${value}`,
					codeBlockId,
				});
			}
		}
	}

	const sampleRate = resolvedSampleRate ?? DEFAULT_SAMPLE_RATE;

	return {
		sampleRate,
		envConstants: [
			`const SAMPLE_RATE ${sampleRate}`,
			`const INV_SAMPLE_RATE ${1 / sampleRate}`,
			`const AUDIO_BUFFER_SIZE ${AUDIO_BUFFER_SIZE}`,
		],
		errors,
	};
}

export function resolveAudioWorkletRuntimeDirectives(state: State) {
	const { sampleRate, errors } = resolveAudioWorkletRuntimeSettingsFromBlocks(state.graphicHelper.codeBlocks);

	return { sampleRate, errors };
}

export function resolveAudioWorkletRuntimeDirectivesFromBlocks(
	codeBlocks: Array<{ parsedDirectives: ParsedDirectiveRecord[]; id?: string | number }>
) {
	const { sampleRate, errors } = resolveAudioWorkletRuntimeSettingsFromBlocks(codeBlocks);

	return { sampleRate, errors };
}

export function getAudioWorkletRuntimeEnvConstantsFromBlocks(
	codeBlocks: Array<{ parsedDirectives: ParsedDirectiveRecord[]; id?: string | number }>
): string[] {
	return resolveAudioWorkletRuntimeSettingsFromBlocks(codeBlocks).envConstants;
}
