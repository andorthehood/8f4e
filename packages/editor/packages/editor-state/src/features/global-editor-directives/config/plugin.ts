import { createGlobalEditorDirectivePlugin } from '../utils';
import { setEditorConfigPath } from '../../editor-config/paths';

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
	const config = draft.resolved.config ?? {};
	setEditorConfigPath(config, path, value);
	draft.resolved.config = config;
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
