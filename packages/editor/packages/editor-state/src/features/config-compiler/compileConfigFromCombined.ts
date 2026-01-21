import { combineConfigBlocks } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import { getConfigSchema } from './configSchema';
import isPlainObject from './isPlainObject';

import type { CodeError, State } from '~/types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
}

/**
 * Compiles the combined config source and maps errors back to their original blocks.
 * @param combined Combined source and line mappings from config blocks.
 * @param compileConfig Compiler callback for config source.
 * @param state Current editor state for schema access and error mapping.
 */
export async function compileConfigFromCombined(
	combined: ReturnType<typeof combineConfigBlocks>,
	compileConfig: CompileConfigFn,
	state: State
): Promise<ConfigBuildResult> {
	const errors: CodeError[] = [];

	// Use runtime registry schema (runtimeRegistry is now required)
	const schema = getConfigSchema(state.runtimeRegistry);

	const { source, lineMappings } = combined;

	// If no config source, return empty config
	if (source.trim().length === 0) {
		return { mergedConfig: {}, errors };
	}

	try {
		// Compile once with the combined source for full schema validation
		const result = await compileConfig(source, schema);

		// Map errors back to individual blocks
		if (result.errors.length > 0) {
			for (const error of result.errors) {
				const mapped = mapErrorLineToBlock(error.line, lineMappings);
				if (mapped) {
					errors.push({
						lineNumber: mapped.localLine,
						message: error.message,
						codeBlockId: mapped.blockId,
					});
				}
			}
		}

		// Use the compiled config directly if available
		let mergedConfig: Record<string, unknown> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			mergedConfig = result.config as Record<string, unknown>;
		}

		return { mergedConfig, errors };
	} catch (error) {
		// On exception, attribute to the first block
		if (lineMappings.length > 0) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: lineMappings[0].blockId,
			});
		}
		return { mergedConfig: {}, errors };
	}
}
