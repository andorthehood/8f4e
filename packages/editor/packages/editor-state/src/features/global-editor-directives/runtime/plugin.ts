import { createGlobalEditorDirectivePlugin } from '../utils';

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
			message: `@runtime: unknown runtime '${value}'`,
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
