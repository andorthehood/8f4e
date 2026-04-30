import type { GlobalEditorDirectivePlugin, ParsedGlobalEditorDirective } from '@8f4e/editor-state-types';
import type { ParsedDirectiveRecord } from '@8f4e/editor-state-types';

export function createGlobalEditorDirectivePlugin(
	name: string,
	apply: NonNullable<GlobalEditorDirectivePlugin['apply']>
): GlobalEditorDirectivePlugin {
	return {
		name,
		apply,
	};
}

export function parseGlobalEditorDirectives(
	parsedDirectives: ParsedDirectiveRecord[],
	plugins: GlobalEditorDirectivePlugin[]
): ParsedGlobalEditorDirective[] {
	const pluginNames = new Set(plugins.map(plugin => plugin.name));

	return parsedDirectives
		.filter(directive => directive.prefix === '@' && pluginNames.has(directive.name))
		.map(directive => ({
			name: directive.name,
			args: directive.args,
			rawRow: directive.rawRow,
		}));
}
