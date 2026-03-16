import type { GlobalEditorDirectivePlugin, ParsedGlobalEditorDirective } from './types';
import type { ParsedDirectiveRecord } from '~/types';

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
