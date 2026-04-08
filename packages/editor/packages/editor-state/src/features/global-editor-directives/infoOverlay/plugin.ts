import { createGlobalEditorDirectivePlugin } from '../utils';
import { formatDidYouMeanSuffix } from '../suggestions';

const BOOLEAN_ARGUMENTS = new Map<string, boolean>([
	['on', true],
	['off', false],
	['true', true],
	['false', false],
]);

export default createGlobalEditorDirectivePlugin('infoOverlay', (directive, draft, context) => {
	if (directive.args.length !== 1) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@infoOverlay requires exactly 1 argument: <on|off>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const rawValue = directive.args[0]?.toLowerCase();
	const value = rawValue ? BOOLEAN_ARGUMENTS.get(rawValue) : undefined;

	if (value === undefined) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@infoOverlay: unsupported value '${directive.args[0]}'${formatDidYouMeanSuffix(directive.args[0], [
				...BOOLEAN_ARGUMENTS.keys(),
			])}`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.infoOverlay;
	if (currentValue === undefined) {
		draft.resolved.infoOverlay = value;
		return;
	}

	if (currentValue !== value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@infoOverlay: conflicting values '${currentValue ? 'on' : 'off'}' and '${value ? 'on' : 'off'}'`,
			codeBlockId: context.codeBlockId,
		});
	}
});
