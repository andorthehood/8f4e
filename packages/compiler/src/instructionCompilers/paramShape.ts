import type { FunctionCodegenContext, InstructionCompiler, ParamShapeLine } from '@8f4e/compiler-spec';
import { registerFunctionParameter } from './param';

/**
 * Instruction compiler for `paramShape`.
 * Expands a prototype memory shape into function pointer parameters.
 */
const paramShape: InstructionCompiler<ParamShapeLine, FunctionCodegenContext> = (line: ParamShapeLine, context) => {
	const expansion = context.currentFunctionParamShapeExpansions?.find(
		expansion => expansion.lineNumber === line.lineNumber
	);
	if (!expansion) {
		throw new Error(`Missing paramShape expansion metadata for line ${line.lineNumber}.`);
	}

	for (const parameter of expansion.parameters) {
		registerFunctionParameter(parameter.type, parameter.name, line, context);
	}

	return context;
};

export default paramShape;
