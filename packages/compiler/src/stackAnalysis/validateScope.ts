import {
	type CompilerASTLine,
	type CompilationContext,
	type ErrorCodeValue,
	type ScopeRule,
} from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

export function validateScope(
	scope: ScopeRule,
	line: CompilerASTLine,
	context: CompilationContext,
	errorCode: ErrorCodeValue
): void {
	let isValid = false;

	switch (scope) {
		case 'module':
			isValid = context.insideModuleBlock === true;
			break;
		case 'moduleOnly':
			isValid = context.insideModuleBlock === true && context.insideFunctionBlock === false;
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
		case 'loop':
			isValid = context.insideLoopBlock === true;
			break;
	}

	if (!isValid) {
		throw getError(errorCode, line, context);
	}
}
