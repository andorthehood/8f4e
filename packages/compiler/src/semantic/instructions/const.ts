import { type CompilationContext, type NormalizedConstLine } from '../../types';

export default function semanticConst(line: NormalizedConstLine, context: CompilationContext) {
	const constName = line.arguments[0].value;
	const constValue = line.arguments[1];
	context.namespace.consts[constName] = {
		value: constValue.value,
		isInteger: constValue.isInteger,
		...(constValue.isFloat64 ? { isFloat64: true } : {}),
	};
}
