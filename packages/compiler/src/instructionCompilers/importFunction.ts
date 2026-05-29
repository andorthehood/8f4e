import { DEFAULT_HOST_IMPORT_MODULE_NAME, ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { ImportLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#import`.
 * Marks the current function as a WebAssembly host import.
 */
const importFunction: InstructionCompiler<ImportLine> = function (line, context) {
	if (context.currentFunctionImport !== undefined) {
		throw getError(ErrorCode.DUPLICATE_FUNCTION_IMPORT, line, context);
	}

	if (context.currentFunctionExportName !== undefined) {
		throw getError(ErrorCode.IMPORT_EXPORT_CONFLICT, line, context);
	}

	context.currentFunctionImport = {
		moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
		fieldName: line.arguments[0].value,
	};
	context.currentFunctionIsImpure = true;

	return context;
};

export default importFunction;
