import type { ExportLine, FunctionCodegenContext, InstructionCompiler } from '@8f4e/compiler-spec';
import { ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

/**
 * Instruction compiler for `#export`.
 * Marks the current function as a WebAssembly export.
 */
const exportFunction: InstructionCompiler<ExportLine, FunctionCodegenContext> = (line, context) => {
	const exportName = line.arguments[0]?.value ?? context.currentFunctionName;

	if (context.currentFunctionImport !== undefined) {
		throw getError(ErrorCode.IMPORT_EXPORT_CONFLICT, line, context);
	}

	if (context.currentFunctionExportName !== undefined) {
		throw getError(ErrorCode.DUPLICATE_EXPORT_NAME, line, context, {
			identifier: exportName,
		});
	}

	context.currentFunctionExportName = exportName;

	return context;
};

export default exportFunction;
