import type { EditorDirectivePlugin, ParsedEditorDirective } from './types';
import type { ParsedDirectiveRecord } from '~/types';

/**
 * Low-level directive line parser. Tries a full-line directive comment first
 * (`; @name` / `; ~name`), then a trailing inline editor directive (`; @name`
 * at the end of a non-comment line). Returns `undefined` when no directive
 * pattern is found.
 */
export function parseDirectiveLine(
	line: string
):
	| { prefix: '@' | '~'; name: string; args: string[]; isTrailing: false }
	| { prefix: '@'; name: string; args: string[]; isTrailing: true }
	| undefined {
	const fullLineMatch = line.match(/^\s*;\s*([@~])(\w+)(?:\s+(.*))?$/);
	if (fullLineMatch) {
		const [, prefix, name, rawArgs] = fullLineMatch;
		return {
			prefix: prefix as '@' | '~',
			name,
			args: rawArgs ? rawArgs.trim().split(/\s+/) : [],
			isTrailing: false,
		};
	}

	const trailingMatch = line.match(/;\s*@(\w+)(?:\s+(.*))?\s*$/);
	if (trailingMatch) {
		const [, name, rawArgs] = trailingMatch;
		return {
			prefix: '@',
			name,
			args: rawArgs ? rawArgs.trim().split(/\s+/) : [],
			isTrailing: true,
		};
	}

	return undefined;
}

export function parseDirectiveComment(line: string): { name: string; args: string[] } | undefined {
	const parsed = parseDirectiveLine(line);
	if (!parsed || parsed.isTrailing || parsed.prefix !== '@') {
		return undefined;
	}
	return { name: parsed.name, args: parsed.args };
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
		if (record.prefix !== '@') {
			return [];
		}

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
	return normalizeEditorDirectiveRecords(
		code.flatMap((line, rawRow) => {
			const parsed = parseDirectiveLine(line);
			if (!parsed) {
				return [];
			}
			return [
				{
					prefix: parsed.prefix,
					name: parsed.name,
					args: parsed.args,
					rawRow,
					sourceLine: line,
					...(parsed.isTrailing && { isTrailing: true as const }),
				},
			];
		}),
		plugins
	);
}

export function hasDirective(code: string[], name: string): boolean {
	return code.some(line => parseDirectiveComment(line)?.name === name);
}
