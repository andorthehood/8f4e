import { FONT_NAMES, type Font } from '@8f4e/sprite-generator';

import { formatDidYouMeanSuffix } from '../suggestions';
import { createGlobalEditorDirectivePlugin } from '../utils';

const ALLOWED_FONTS = new Set<Font>(FONT_NAMES);

export default createGlobalEditorDirectivePlugin('font', (directive, draft, context) => {
	if (directive.args.length === 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@font requires a font argument',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const value = directive.args[0] as Font;
	if (!ALLOWED_FONTS.has(value)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@font: unsupported font '${value}'${formatDidYouMeanSuffix(value, FONT_NAMES)}`,
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
