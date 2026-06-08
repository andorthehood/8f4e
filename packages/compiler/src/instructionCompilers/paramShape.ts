import type { FunctionCodegenContext, InstructionCompiler, ParamShapeLine } from '@8f4e/compiler-spec';
import { getParamShapeExpansion } from '../prototypes/paramShape';
import { registerFunctionParameter } from './param';

/**
 * Instruction compiler for `paramShape`.
 * Expands a prototype memory shape into function pointer parameters.
 */
const paramShape: InstructionCompiler<ParamShapeLine, FunctionCodegenContext> = (line: ParamShapeLine, context) => {
	const expansion = getParamShapeExpansion(line, context.prototypeShapes ?? {}, context);

	for (const parameter of expansion.parameters) {
		registerFunctionParameter(parameter.type, parameter.name, line, context);
	}

	return context;
};

export default paramShape;
