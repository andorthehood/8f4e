import deepMergeConfig from './deepMergeConfig';
import { compileConfigBlocksByType } from './compileConfigBlocksByType';

import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { CodeBlockGraphicData, CodeError, State } from '~/types';
import type { ConfigType } from './configTypes';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface CompileConfigWithDefaultsParams<TConfig> {
	codeBlocks: CodeBlockGraphicData[];
	configType: ConfigType;
	schema: JSONSchemaLike;
	compileConfig: CompileConfigFn;
	defaultConfig: TConfig;
}

interface CompileConfigWithDefaultsResult<TConfig> {
	compiledConfig: TConfig;
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
	hasSource: boolean;
}

export async function compileConfigWithDefaults<TConfig>(
	params: CompileConfigWithDefaultsParams<TConfig>
): Promise<CompileConfigWithDefaultsResult<TConfig>> {
	const { codeBlocks, configType, schema, compileConfig, defaultConfig } = params;
	const { mergedConfig, errors, hasSource } = await compileConfigBlocksByType({
		codeBlocks,
		configType,
		schema,
		compileConfig,
	});

	const compiledConfig = deepMergeConfig(defaultConfig as unknown as Record<string, unknown>, mergedConfig) as TConfig;

	return { compiledConfig, mergedConfig, errors, hasSource };
}
