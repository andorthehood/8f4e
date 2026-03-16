import { createGlobalEditorDirectivePlugin } from '../utils';

export default createGlobalEditorDirectivePlugin('exportFileName', (directive, draft, context) => {
	if (directive.args.length === 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@exportFileName requires a file name argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const value = directive.args[0];
	if (!value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@exportFileName requires a non-empty file name argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.exportFileName;
	if (currentValue === undefined) {
		draft.resolved.exportFileName = value;
		return;
	}

	if (currentValue !== value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@exportFileName: conflicting values '${currentValue}' and '${value}'`,
			codeBlockId: context.codeBlockId,
		});
	}
});
