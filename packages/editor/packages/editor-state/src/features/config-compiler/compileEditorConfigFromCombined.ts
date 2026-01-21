import { combineEditorConfigBlocks } from './combineConfigBlocks';
import { mapErrorLineToBlock } from './mapErrorLineToBlock';
import { getEditorConfigSchema } from './configSchema';
import isPlainObject from './isPlainObject';

import type { CodeError, State, EditorSettings } from '~/types';

type CompileConfigFn = NonNullable<State['callbacks']['compileConfig']>;

interface EditorConfigBuildResult {
	editorSettings: Partial<EditorSettings>;
	errors: CodeError[];
}

/**
 * Compiles the combined editor config source and maps errors back to their original blocks.
 * @param combined Combined source and line mappings from editor config blocks.
 * @param compileConfig Compiler callback for config source.
 */
export async function compileEditorConfigFromCombined(
	combined: ReturnType<typeof combineEditorConfigBlocks>,
	compileConfig: CompileConfigFn
): Promise<EditorConfigBuildResult> {
	const errors: CodeError[] = [];

	const schema = getEditorConfigSchema();
	const { source, lineMappings } = combined;

	// If no config source, return empty settings
	if (source.trim().length === 0) {
		return { editorSettings: {}, errors };
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
		let editorSettings: Partial<EditorSettings> = {};
		if (result.config !== null && isPlainObject(result.config)) {
			editorSettings = result.config as Partial<EditorSettings>;
		}

		return { editorSettings, errors };
	} catch (error) {
		// On exception, attribute to the first block
		if (lineMappings.length > 0) {
			errors.push({
				lineNumber: 1,
				message: error instanceof Error ? error.message : String(error),
				codeBlockId: lineMappings[0].blockId,
			});
		}
		return { editorSettings: {}, errors };
	}
}
