import type { ExportLine, FunctionCodegenContext, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `#export`.
 * Marks the current function as a WebAssembly export.
 */
const exportFunction: InstructionCompiler<ExportLine, FunctionCodegenContext> = (line, context) => {
	const exportName = line.arguments[0]?.value ?? context.currentFunctionName;
	context.currentFunctionExportName = exportName;

	return context;
};

export default exportFunction;
