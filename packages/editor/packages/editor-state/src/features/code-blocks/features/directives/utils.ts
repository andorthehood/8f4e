import {
	type EditorDirectivePlugin,
	type ParsedDirectiveRecord,
	type ParsedEditorDirective,
	parseDirectiveLineRecords,
	parseDirectiveRecords,
} from '@8f4e/editor-state-types';

export { parseDirectiveLineRecords, parseDirectiveRecords } from '@8f4e/editor-state-types';

export interface DirectiveComment {
	name: string;
	args: string[];
}

export function parseDirectiveComments(line: string): DirectiveComment[] {
	return parseDirectiveLineRecords(line).flatMap(parsed =>
		parsed.isTrailing ? [] : [{ name: parsed.name, args: parsed.args }]
	);
}

export function serializeDirectiveComments(directives: DirectiveComment[]): string | undefined {
	if (directives.length === 0) {
		return undefined;
	}

	return `; ${directives
		.map(({ name, args }) => (args.length > 0 ? `@${name} ${args.join(' ')}` : `@${name}`))
		.join(' ')}`;
}

export function createDirectivePlugin(
	name: string,
	apply: NonNullable<EditorDirectivePlugin['apply']>,
	options: Pick<EditorDirectivePlugin, 'aliases' | 'allowTrailingComment' | 'clearGraphicData'> = {}
): EditorDirectivePlugin {
	return {
		name,
		...options,
		apply,
	};
}

/**
 * Shared alias-normalization helper. Filters `ParsedDirectiveRecord[]` to
 * editor (`@`) directives only, resolves aliases to canonical plugin names, and
 * applies the `allowTrailingComment` gate for trailing records.
 *
 * Both `parseEditorDirectives` and `deriveDirectiveState` delegate to this so
 * alias normalization lives in exactly one place.
 */
export function normalizeEditorDirectiveRecords(
	records: ParsedDirectiveRecord[],
	plugins: EditorDirectivePlugin[]
): ParsedEditorDirective[] {
	const pluginEntries = plugins.flatMap(plugin =>
		[plugin.name, ...(plugin.aliases ?? [])].map(name => [name, plugin] as const)
	);
	const pluginsByName = new Map(pluginEntries);

	return records.flatMap(record => {
		const plugin = pluginsByName.get(record.name);
		if (!plugin) {
			return [];
		}

		if (record.isTrailing && !plugin.allowTrailingComment) {
			return [];
		}

		return [
			{
				name: plugin.name,
				rawRow: record.rawRow,
				args: record.args,
				sourceLine: record.sourceLine,
			},
		];
	});
}

export function parseEditorDirectives(code: string[], plugins: EditorDirectivePlugin[]): ParsedEditorDirective[] {
	return normalizeEditorDirectiveRecords(parseDirectiveRecords(code), plugins);
}

export function hasDirective(code: string[], name: string): boolean {
	return code.some(line => parseDirectiveComments(line).some(directive => directive.name === name));
}
