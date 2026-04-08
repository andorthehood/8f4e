import { formatDidYouMeanSuffix } from '../suggestions';
import { createGlobalEditorDirectivePlugin } from '../utils';

import type { RuntimeRegistry, Runtimes } from '../../runtime/types';

export function resolveSelectedRuntimeId(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): string {
	if (requestedRuntimeId && requestedRuntimeId in runtimeRegistry) {
		return requestedRuntimeId;
	}

	return defaultRuntimeId;
}

export function getSelectedRuntimeDefaults(
	requestedRuntimeId: string | undefined,
	runtimeRegistry: RuntimeRegistry,
	defaultRuntimeId: string
): Runtimes {
	const resolvedRuntimeId = resolveSelectedRuntimeId(requestedRuntimeId, runtimeRegistry, defaultRuntimeId);
	return runtimeRegistry[resolvedRuntimeId].defaults as unknown as Runtimes;
}

export default createGlobalEditorDirectivePlugin('runtime', (directive, draft, context) => {
	if (directive.args.length === 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@runtime requires a runtime id argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const value = directive.args[0];
	if (!value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@runtime requires a non-empty runtime id argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	if (!(value in context.runtimeRegistry)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@runtime: unknown runtime '${value}'${formatDidYouMeanSuffix(value, Object.keys(context.runtimeRegistry))}`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.runtime;
	if (currentValue === undefined) {
		draft.resolved.runtime = value;
		return;
	}

	if (currentValue !== value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@runtime: conflicting values '${currentValue}' and '${value}'`,
			codeBlockId: context.codeBlockId,
		});
	}
});
