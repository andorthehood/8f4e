import { combineConfigBlocks } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import { getConfigSchema } from './configSchema';
import isPlainObject from './isPlainObject';

import { remapErrors } from '../macro-expansion/remapErrors';

import type { CodeError, State } from '~/types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface ConfigBuildResult {
	mergedConfig: Record<string, unknown>;
	errors: CodeError[];
}

/**
 * Compiles the combined config source and maps errors back to their original blocks.
 * Applies macro expansion error remapping after block-level error mapping.
 * @param combined Combined source and line mappings from config blocks.
 * @param compileConfig Compiler callback for config source.
 * @param state Current editor state for schema access and error mapping.
 */
export async function compileConfigFromCombined(
	combined: ReturnType<typeof combineConfigBlocks>,
	compileConfig: CompileConfigFn,
	state: State
): Promise<ConfigBuildResult> {
	const errors: CodeError[] = [...combined.macroErrors];

	if (combined.macroErrors.length > 0) {
		return { mergedConfig: {}, errors };
	}

	const schema = getConfigSchema(state.runtimeRegistry);

	const { source, lineMappings, blockLineMappings } = combined;

	if (source.trim().length === 0) {
		return { mergedConfig: {}, errors };
	}

	try {
		const result = await compileConfig(source, schema);

		if (result.errors.length > 0) {
			for (const error of result.errors) {
				const mapped = mapErrorLineToBlock(error.line, lineMappings);
				if (mapped) {
					let mappedError: CodeError = {
						lineNumber: mapped.localLine,
						message: error.message,
						codeBlockId: mapped.blockId,
					};

					const macroMappings = blockLineMappings.get(mapped.blockId);
					if (macroMappings && macroMappings.length > 0) {
						const remapped = remapErrors([mappedError], macroMappings);
						mappedError = remapped[0];
					}

					errors.push(mappedError);
				}
			}
		}

		let mergedConfig: Record<string, unknown> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			mergedConfig = result.config as Record<string, unknown>;
		}

		return { mergedConfig, errors };
	} catch (error) {
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
