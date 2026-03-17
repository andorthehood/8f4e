import { createGlobalEditorDirectivePlugin } from '../utils';

export default createGlobalEditorDirectivePlugin('disableAutoCompilation', (directive, draft, context) => {
	if (directive.args.length > 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@disableAutoCompilation does not take any arguments',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.disableAutoCompilation;
	if (currentValue === undefined) {
		draft.resolved.disableAutoCompilation = true;
		return;
	}

	if (currentValue !== true) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@disableAutoCompilation: conflicting values',
			codeBlockId: context.codeBlockId,
		});
	}
});
