import { compileConfig as compileStackConfig } from '@8f4e/stack-config-compiler';

import type { ConfigCompilationResult, JSONSchemaLike } from '@8f4e/editor-state';

/**
 * Compiles a stack-config program source into a JSON configuration object.
 * This is a wrapper around the @8f4e/stack-config-compiler package.
 *
 * @param source - The config program source code (one command per line)
 * @param schema - JSON Schema describing the expected config structure
 * @returns Promise containing the compiled config object and any errors
 */
export default async function compileConfig(source: string, schema: JSONSchemaLike): Promise<ConfigCompilationResult> {
	return compileStackConfig(source, { schema });
}
