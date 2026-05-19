import {
	type CompilationContext,
	type ErrorCodeValue,
	type InstructionCompiler,
	type ScopeRule,
} from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

export function validateScope(
	scope: ScopeRule,
	line: Parameters<InstructionCompiler>[0],
	context: CompilationContext,
	errorCode: ErrorCodeValue
): void {
	let isValid = false;

	switch (scope) {
		case 'module':
			isValid = context.insideModuleBlock === true;
			break;
		case 'function':
			isValid = context.insideFunctionBlock === true;
			break;
		case 'moduleOrFunction':
			isValid = context.insideModuleBlock === true || context.insideFunctionBlock === true;
			break;
		case 'block':
			isValid = context.insideGenericBlock === true;
			break;
		case 'constants':
			isValid = context.insideConstantsBlock === true;
			break;
		case 'map':
			isValid = context.insideMapBlock === true;
			break;
	}

	if (!isValid) {
		throw getError(errorCode, line, context);
	}
}
