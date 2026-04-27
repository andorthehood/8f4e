import { FONT_NAMES, type Font } from '@8f4e/sprite-generator';

import { formatDidYouMeanSuffix } from '../suggestions';
import { createGlobalEditorDirectivePlugin } from '../utils';

import type {
	GlobalEditorDirectiveContext,
	GlobalEditorDirectiveResolutionResult,
	ParsedGlobalEditorDirective,
} from '../types';

const ALLOWED_FONTS = new Set<Font>(FONT_NAMES);
const CONFIG_PATHS = ['font', 'wireThickness'] as const;

type ConfigPath = (typeof CONFIG_PATHS)[number];

function isConfigPath(path: string): path is ConfigPath {
	return (CONFIG_PATHS as readonly string[]).includes(path);
}

function parseWireThickness(rawValue: string): number | null {
	const value = Number(rawValue);
	if (!Number.isFinite(value) || value < 1 || value > 100) {
		return null;
	}

	return value;
}

function reportError(
	draft: GlobalEditorDirectiveResolutionResult,
	directive: ParsedGlobalEditorDirective,
	context: GlobalEditorDirectiveContext,
	message: string
): void {
	draft.errors.push({
		lineNumber: directive.rawRow,
		message,
		codeBlockId: context.codeBlockId,
	});
}

function applyFontConfig(
	value: string,
	directive: ParsedGlobalEditorDirective,
	draft: GlobalEditorDirectiveResolutionResult,
	context: GlobalEditorDirectiveContext
): void {
	const font = value as Font;
	if (!ALLOWED_FONTS.has(font)) {
		reportError(
			draft,
			directive,
			context,
			`@config font: unsupported font '${value}'${formatDidYouMeanSuffix(value, FONT_NAMES)}`
		);
		return;
	}

	const currentValue = draft.resolved.font;
	if (currentValue === undefined) {
		draft.resolved.font = font;
		return;
	}

	if (currentValue !== font) {
		reportError(draft, directive, context, `@config font: conflicting values '${currentValue}' and '${font}'`);
	}
}

function applyWireThicknessConfig(
	value: string,
	directive: ParsedGlobalEditorDirective,
	draft: GlobalEditorDirectiveResolutionResult,
	context: GlobalEditorDirectiveContext
): void {
	const thickness = parseWireThickness(value);
	if (thickness === null) {
		reportError(draft, directive, context, `@config wireThickness: invalid value '${value}'`);
		return;
	}

	const currentValue = draft.resolved.wireThickness;
	if (currentValue === undefined) {
		draft.resolved.wireThickness = thickness;
		return;
	}

	if (currentValue !== thickness) {
		reportError(
			draft,
			directive,
			context,
			`@config wireThickness: conflicting values '${currentValue}' and '${thickness}'`
		);
	}
}

export default createGlobalEditorDirectivePlugin('config', (directive, draft, context) => {
	if (directive.args.length !== 2) {
		reportError(draft, directive, context, '@config requires exactly 2 arguments: <path> <value>');
		return;
	}

	const [path, value] = directive.args;
	if (!isConfigPath(path)) {
		reportError(
			draft,
			directive,
			context,
			`@config: unknown config path '${path}'${formatDidYouMeanSuffix(path, CONFIG_PATHS)}`
		);
		return;
	}

	if (path === 'font') {
		applyFontConfig(value, directive, draft, context);
		return;
	}

	applyWireThicknessConfig(value, directive, draft, context);
});
