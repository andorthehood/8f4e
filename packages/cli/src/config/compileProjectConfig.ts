import { compileConfig, CompileError } from '@8f4e/stack-config-compiler';

import { extractConfigBody, extractConfigType } from './blockParsing';
import isPlainObject from './isPlainObject';
import deepMergeConfig from './mergeConfig';
import DEFAULT_PROJECT_CONFIG from './defaults';

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

function formatConfigErrors(errors: CompileError[]): string {
	return errors.map(error => `line ${error.line}: ${error.message}`).join('\n');
}

export default function compileProjectConfig(
	blocks: ProjectCodeBlock[],
	options: CompileProjectConfigOptions = {}
): CompileProjectConfigResult {
	const configType = options.configType ?? 'project';
	const defaultProjectConfig = options.defaultProjectConfig ?? DEFAULT_PROJECT_CONFIG;

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

	const configResult = compileConfig(configSource);
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
