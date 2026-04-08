import { createGlobalEditorDirectivePlugin } from '../utils';

type SupportedFont =
	| 'bios8x16'
	| 'terminus8x16'
	| 'terminus8x16bold'
	| '6x10'
	| 'terminus10x18'
	| 'terminus10x18bold'
	| 'terminus12x24'
	| 'terminus12x24bold'
	| '16x32';

const ALLOWED_FONTS = new Set<SupportedFont>([
	'bios8x16',
	'terminus8x16',
	'terminus8x16bold',
	'6x10',
	'terminus10x18',
	'terminus10x18bold',
	'terminus12x24',
	'terminus12x24bold',
	'16x32',
]);

export default createGlobalEditorDirectivePlugin('font', (directive, draft, context) => {
	if (directive.args.length === 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@font requires a font argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const value = directive.args[0] as SupportedFont;
	if (!ALLOWED_FONTS.has(value)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@font: unsupported font '${value}'`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const currentValue = draft.resolved.font;
	if (currentValue === undefined) {
		draft.resolved.font = value;
		return;
	}

	if (currentValue !== value) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@font: conflicting values '${currentValue}' and '${value}'`,
			codeBlockId: context.codeBlockId,
		});
	}
});
