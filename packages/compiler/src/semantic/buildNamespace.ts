import { ArgumentType } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../compilerError';
import { type AST, type CompiledFunctionLookup, type FunctionSignature } from '../types';

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic normalization (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 */
export function collectFunctionMetadataFromAsts(asts: AST[], startingWasmIndex: number): CompiledFunctionLookup {
	const result: CompiledFunctionLookup = {};

	for (const [index, ast] of asts.entries()) {
		const functionLine = ast.find(line => line.instruction === 'function')!;
		const idArgument = functionLine.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string };
		if (result[idArgument.value]) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, functionLine, undefined, { identifier: idArgument.value });
		}
		const signature: FunctionSignature = {
			parameters: ast.flatMap(line => {
				if (line.instruction !== 'param' || line.arguments[0]?.type !== ArgumentType.IDENTIFIER) {
					return [];
				}

				return [line.arguments[0].value as FunctionSignature['parameters'][number]];
			}),
			returns: [],
		};

		const functionEndLine = ast.find(line => line.instruction === 'functionEnd');
		if (functionEndLine) {
			signature.returns = functionEndLine.arguments.map(
				arg => (arg as { type: ArgumentType.IDENTIFIER; value: FunctionSignature['returns'][number] }).value
			);
		}

		result[idArgument.value] = {
			id: idArgument.value,
			signature,
			body: [],
			locals: [],
			wasmIndex: startingWasmIndex + index,
		};
	}

	return result;
}

export function assertUniqueModuleIds(asts: AST[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		const moduleLine = ast.find(line => line.instruction === 'module')!;
		const id = moduleLine.arguments[0] as { type: ArgumentType.IDENTIFIER; value: string };
		if (seenModuleIds.has(id.value)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, moduleLine, undefined, { identifier: id.value });
		}
		seenModuleIds.add(id.value);
	}
}
