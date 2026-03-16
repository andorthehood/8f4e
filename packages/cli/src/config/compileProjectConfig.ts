import { compileConfig, CompileError } from '@8f4e/stack-config-compiler';

import { extractConfigBody, extractConfigType } from './blockParsing';
import isPlainObject from './isPlainObject';
import deepMergeConfig from './mergeConfig';
import { createDefaultProjectConfig, DEFAULT_RUNTIME_ID, RUNTIME_DEFAULTS } from './defaults';

import getBlockType from '../shared/getBlockType';

import type { ProjectCodeBlock } from '../shared/types';

interface CompileProjectConfigOptions {
	configType?: string;
	defaultProjectConfig?: Record<string, unknown>;
}

interface CompileProjectConfigResult {
	compiledProjectConfig: Record<string, unknown>;
	configSource: string;
}

function resolveRuntimeIdFromGlobalEditorDirectives(blocks: ProjectCodeBlock[]): string {
	let resolvedRuntimeId: string | undefined;

	for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
		const block = blocks[blockIndex];
		if (block.disabled) {
			continue;
		}

		for (let lineIndex = 0; lineIndex < block.code.length; lineIndex += 1) {
			const trimmed = block.code[lineIndex].trim();
			const match = trimmed.match(/^;\s*@runtime(?:\s+(\S+))?\s*$/);
			if (!match) {
				continue;
			}

			const runtimeId = match[1];
			if (!runtimeId) {
				throw new Error(
					`Global editor directive error: block ${blockIndex + 1}, line ${lineIndex + 1}: @runtime requires a runtime id argument`
				);
			}

			if (!(runtimeId in RUNTIME_DEFAULTS)) {
				throw new Error(
					`Global editor directive error: block ${blockIndex + 1}, line ${lineIndex + 1}: @runtime: unknown runtime '${runtimeId}'`
				);
			}

			if (resolvedRuntimeId === undefined) {
				resolvedRuntimeId = runtimeId;
			} else if (resolvedRuntimeId !== runtimeId) {
				throw new Error(
					`Global editor directive error: block ${blockIndex + 1}, line ${lineIndex + 1}: @runtime: conflicting values '${resolvedRuntimeId}' and '${runtimeId}'`
				);
			}
		}
	}

	return resolvedRuntimeId ?? DEFAULT_RUNTIME_ID;
}

function formatConfigErrors(errors: CompileError[]): string {
	return errors
		.map(error => {
			const blockPrefix = typeof error.blockIndex === 'number' ? `block ${error.blockIndex + 1}, ` : '';
			return `${blockPrefix}line ${error.line}: ${error.message}`;
		})
		.join('\n');
}

export default function compileProjectConfig(
	blocks: ProjectCodeBlock[],
	options: CompileProjectConfigOptions = {}
): CompileProjectConfigResult {
	const configType = options.configType ?? 'project';
	const selectedRuntimeId = resolveRuntimeIdFromGlobalEditorDirectives(blocks);
	const defaultProjectConfig = options.defaultProjectConfig ?? createDefaultProjectConfig(selectedRuntimeId);

	const configSources: string[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		if (getBlockType(block.code) !== 'config') {
			continue;
		}

		const type = extractConfigType(block.code);
		if (type !== configType) {
			continue;
		}

		const body = extractConfigBody(block.code).join('\n');
		if (body.trim().length > 0) {
			configSources.push(body);
		}
	}

	const configSource = configSources.join('\n\n');

	if (configSource.trim().length === 0) {
		return {
			compiledProjectConfig: { ...defaultProjectConfig },
			configSource,
		};
	}

	const configResult = compileConfig(configSources);
	if (configResult.errors.length > 0) {
		const errorMessage = formatConfigErrors(configResult.errors);
		const error = new Error(`Config compilation failed:\n${errorMessage}`);
		(error as Error & { errors?: CompileError[] }).errors = configResult.errors;
		throw error;
	}

	const compiledConfig =
		configResult.config && isPlainObject(configResult.config) ? (configResult.config as Record<string, unknown>) : {};

	return {
		compiledProjectConfig: deepMergeConfig(defaultProjectConfig, compiledConfig),
		configSource,
	};
}
