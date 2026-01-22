import { combineConfigBlocksByType, ConfigType } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import isPlainObject from './isPlainObject';

import type { JSONSchemaLike } from '@8f4e/stack-config-compiler';
import type { CodeBlockGraphicData, CodeError, State } from '~/types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface CompileConfigParams {
	codeBlocks: CodeBlockGraphicData[];
	configType: ConfigType;
	schema: JSONSchemaLike;
	compileConfig: CompileConfigFn;
}

interface CompileConfigResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
	hasSource: boolean;
}

export async function compileConfigBlocksByType({
	codeBlocks,
	configType,
	schema,
	compileConfig,
}: CompileConfigParams): Promise<CompileConfigResult> {
	const errors: CodeError[] = [];
	const combined = combineConfigBlocksByType(codeBlocks, configType);
	const hasSource = combined.source.trim().length > 0;

	if (!hasSource) {
		return { mergedConfig: {}, errors, hasSource };
	}

	try {
		const result = await compileConfig(combined.source, schema);

		if (result.errors.length > 0) {
			for (const error of result.errors) {
				const mapped = mapErrorLineToBlock(error.line, combined.lineMappings);
				if (mapped) {
					errors.push({
						lineNumber: mapped.localLine,
						message: error.message,
						codeBlockId: mapped.blockId,
					});
				}
			}
		}

		let mergedConfig: Record<string, unknown> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			mergedConfig = result.config as Record<string, unknown>;
		}

		return { mergedConfig, errors, hasSource };
	} catch (error) {
		if (combined.lineMappings.length > 0) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: combined.lineMappings[0].blockId,
			});
		}
		return { mergedConfig: {}, errors, hasSource };
	}
}
