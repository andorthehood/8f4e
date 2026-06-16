import type { ImportLine, InstructionCompiler } from '@8f4e/compiler-spec';
import { DEFAULT_HOST_IMPORT_MODULE_NAME } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#import`.
 * Marks the current function as a WebAssembly host import.
 */
const importFunction: InstructionCompiler<ImportLine> = (line, context) => {
	context.currentFunctionImport = {
		moduleName: DEFAULT_HOST_IMPORT_MODULE_NAME,
		fieldName: line.arguments[0].value,
	};
	context.currentFunctionIsImpure = true;

	return context;
};

export default importFunction;
