import type { CodeBlockGraphicData } from '@8f4e/editor';

export interface AudioWorkletDirectiveError {
	lineNumber: number;
	message: string;
	codeBlockId: string | number;
}

export interface AudioWorkletInputRoute {
	moduleId: string;
	memoryId: string;
	input: number;
	channel: number;
}

export interface AudioWorkletOutputRoute {
	moduleId: string;
	memoryId: string;
	output: number;
	channel: number;
}

export interface AudioWorkletDirectiveResolution {
	audioInputs: AudioWorkletInputRoute[];
	audioOutputs: AudioWorkletOutputRoute[];
	errors: AudioWorkletDirectiveError[];
}

function parseIndexArg(
	value: string,
	directiveName: string,
	fieldName: string,
	codeBlockId: string | number,
	lineNumber: number
) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0) {
		return {
			error: {
				lineNumber,
				message: `~${directiveName}: invalid ${fieldName} '${value}' (must be a non-negative integer)`,
				codeBlockId,
			},
		};
	}

	return { value: parsed };
}

export function resolveAudioWorkletRouting(codeBlocks: CodeBlockGraphicData[]): AudioWorkletDirectiveResolution {
	const audioInputs: AudioWorkletInputRoute[] = [];
	const audioOutputs: AudioWorkletOutputRoute[] = [];
	const errors: AudioWorkletDirectiveError[] = [];

	for (const block of codeBlocks) {
		const runtimeDirectives = block.parsedDirectives.filter(
			directive => directive.prefix === '~' && (directive.name === 'audioInput' || directive.name === 'audioOutput')
		);
		const codeBlockId = block.id;

		for (const directive of runtimeDirectives) {
			if (block.blockType !== 'module' || !block.moduleId) {
				errors.push({
					lineNumber: directive.rawRow,
					message: `~${directive.name} can only be used inside a module block`,
					codeBlockId,
				});
				continue;
			}

			if (directive.args.length < 3) {
				errors.push({
					lineNumber: directive.rawRow,
					message:
						directive.name === 'audioInput'
							? '~audioInput requires <bufferName> <input> <channel>'
							: '~audioOutput requires <bufferName> <output> <channel>',
					codeBlockId,
				});
				continue;
			}

			const [memoryId, indexArg, channelArg] = directive.args;
			if (!memoryId) {
				errors.push({
					lineNumber: directive.rawRow,
					message: `~${directive.name} requires a non-empty buffer name`,
					codeBlockId,
				});
				continue;
			}

			const indexName = directive.name === 'audioInput' ? 'input' : 'output';
			const index = parseIndexArg(indexArg, directive.name, indexName, codeBlockId, directive.rawRow);
			if (index.error) {
				errors.push(index.error);
				continue;
			}

			const channel = parseIndexArg(channelArg, directive.name, 'channel', codeBlockId, directive.rawRow);
			if (channel.error) {
				errors.push(channel.error);
				continue;
			}

			if (directive.name === 'audioInput') {
				audioInputs.push({
					moduleId: block.moduleId,
					memoryId,
					input: index.value!,
					channel: channel.value!,
				});
				continue;
			}

			audioOutputs.push({
				moduleId: block.moduleId,
				memoryId,
				output: index.value!,
				channel: channel.value!,
			});
		}
	}

	return {
		audioInputs,
		audioOutputs,
		errors,
	};
}
