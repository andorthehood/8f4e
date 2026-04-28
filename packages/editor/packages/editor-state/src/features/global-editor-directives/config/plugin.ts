import { createGlobalEditorDirectivePlugin } from '../utils';

export default createGlobalEditorDirectivePlugin('config', (directive, draft, context) => {
	if (directive.args.length !== 2) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@config requires exactly 2 arguments: <path> <value>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const [path, value] = directive.args;
	draft.resolved.configEntries = [
		...(draft.resolved.configEntries ?? []),
		{
			path,
			value,
			rawRow: directive.rawRow,
			codeBlockId: context.codeBlockId,
		},
	];
});
