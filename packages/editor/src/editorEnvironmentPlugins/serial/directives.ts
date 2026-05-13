import { compilerSourceBlockTypes } from '@8f4e/compiler-spec';

import { getActiveCodeBlocksForEnvironmentPlugins } from '../codeBlocks';

import type { CodeBlockGraphicData, CodeError, State } from '@8f4e/editor-state-types';
import type { CompilerSourceBlockType } from '@8f4e/compiler-spec';
import type { SerialInCallbackBinding, SerialInPipeline } from './types';

const diagnosticBlockTypes = new Set<string>(compilerSourceBlockTypes);

function isDiagnosticBlockType(blockType: string): blockType is CompilerSourceBlockType {
	return diagnosticBlockTypes.has(blockType);
}

export interface SerialDirectiveParseResult {
	pipelines: SerialInPipeline[];
	callbacks: SerialInCallbackBinding[];
	errors: CodeError[];
}

function getCodeBlockType(block: CodeBlockGraphicData): CodeError['codeBlockType'] | undefined {
	if (isDiagnosticBlockType(block.blockType)) {
		return block.blockType;
	}

	return undefined;
}

function createDirectiveError(block: CodeBlockGraphicData, rawRow: number, message: string): CodeError {
	return {
		codeBlockId: block.id,
		codeBlockType: getCodeBlockType(block),
		lineNumber: rawRow + 1,
		message,
	};
}

function parsePositiveInteger(value: string | undefined): number | undefined {
	if (!value || !/^\d+$/.test(value)) {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed <= 0) {
		return undefined;
	}

	return parsed;
}

export default function parseSerialDirectives(state: State): SerialDirectiveParseResult {
	const pipelines: SerialInPipeline[] = [];
	const callbacks: SerialInCallbackBinding[] = [];
	const errors: CodeError[] = [];
	const pipelinePorts = new Set<string>();
	const callbackKeys = new Set<string>();

	for (const block of getActiveCodeBlocksForEnvironmentPlugins(state)) {
		for (const directive of block.parsedDirectives ?? []) {
			if (directive.prefix !== '@') {
				continue;
			}

			if (directive.name === 'serialIn') {
				const [port, baudRateArg, bufferMemoryId, frameBytesArg, extraArg] = directive.args;
				const baudRate = parsePositiveInteger(baudRateArg);
				const frameBytes = parsePositiveInteger(frameBytesArg);
				if (!port || !baudRate || !bufferMemoryId || !frameBytes || extraArg) {
					errors.push(
						createDirectiveError(
							block,
							directive.rawRow,
							'@serialIn requires <port> <baudRate> <bufferMemoryId> <frameBytes>.'
						)
					);
					continue;
				}

				if (pipelinePorts.has(port)) {
					errors.push(createDirectiveError(block, directive.rawRow, `Duplicate @serialIn binding for port "${port}".`));
					continue;
				}

				pipelinePorts.add(port);
				pipelines.push({
					port,
					baudRate,
					bufferMemoryId,
					frameBytes,
					lineNumber: directive.rawRow + 1,
					codeBlockId: block.id,
					codeBlockType: getCodeBlockType(block),
					moduleId: block.moduleId,
				});
				continue;
			}

			if (directive.name === 'serialInCallback') {
				const [port, exportName, extraArg] = directive.args;
				if (!port || !exportName || extraArg) {
					errors.push(
						createDirectiveError(block, directive.rawRow, '@serialInCallback requires <port> <callbackExportName>.')
					);
					continue;
				}

				const callbackKey = `${port}\u0000${exportName}`;
				if (callbackKeys.has(callbackKey)) {
					errors.push(
						createDirectiveError(
							block,
							directive.rawRow,
							`Duplicate @serialInCallback binding for port "${port}" and callback "${exportName}".`
						)
					);
					continue;
				}

				callbackKeys.add(callbackKey);
				callbacks.push({
					port,
					exportName,
					lineNumber: directive.rawRow + 1,
					codeBlockId: block.id,
					codeBlockType: getCodeBlockType(block),
				});
			}
		}
	}

	const validPorts = new Set(pipelines.map(pipeline => pipeline.port));
	for (const callback of callbacks) {
		if (!validPorts.has(callback.port)) {
			errors.push({
				codeBlockId: callback.codeBlockId,
				codeBlockType: callback.codeBlockType,
				lineNumber: callback.lineNumber,
				message: `@serialInCallback references port "${callback.port}" without a matching @serialIn directive.`,
			});
		}
	}

	return { pipelines, callbacks, errors };
}
