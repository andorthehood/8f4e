import type { EditorDirectivePlugin, ParsedEditorDirective } from './types';
import type { ParsedDirectiveRecord } from '~/types';

export interface DirectiveComment {
	name: string;
	args: string[];
}

type ParsedDirectiveLineRecord =
	| { prefix: '@' | '~'; name: string; args: string[]; isTrailing: false }
	| { prefix: '@'; name: string; args: string[]; isTrailing: true };

function parseDirectiveCommentSegment(segment: string, isTrailing: boolean): ParsedDirectiveLineRecord[] {
	const trimmed = segment.trim();
	if (!trimmed) {
		return [];
	}

	const tokens = trimmed.split(/\s+/);
	const directives: ParsedDirectiveLineRecord[] = [];
	let current: ParsedDirectiveLineRecord | undefined;

	for (const token of tokens) {
		const directiveMatch = token.match(/^([@~])(\w+)$/);
		if (directiveMatch) {
			const [, prefix, name] = directiveMatch;
			if (isTrailing && prefix !== '@') {
				return [];
			}

			if (current) {
				directives.push(current);
			}

			current = {
				prefix: prefix as '@' | '~',
				name,
				args: [],
				isTrailing,
			} as ParsedDirectiveLineRecord;
			continue;
		}

		if (!current) {
			return [];
		}

		current.args.push(token);
	}

	if (current) {
		directives.push(current);
	}

	return directives;
}

export function parseDirectiveLineRecords(line: string): ParsedDirectiveLineRecord[] {
	if (/^\s*;/.test(line)) {
		return parseDirectiveCommentSegment(line.replace(/^\s*;\s*/, ''), false);
	}

	const commentStart = line.indexOf(';');
	if (commentStart === -1) {
		return [];
	}

	return parseDirectiveCommentSegment(line.slice(commentStart + 1), true);
}

export function parseDirectiveComments(line: string): DirectiveComment[] {
	return parseDirectiveLineRecords(line).flatMap(parsed => {
		if (parsed.isTrailing || parsed.prefix !== '@') {
			return [];
		}

		return [{ name: parsed.name, args: parsed.args }];
	});
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
			return parseDirectiveLineRecords(line).map(parsed => ({
				prefix: parsed.prefix,
				name: parsed.name,
				args: parsed.args,
				rawRow,
				sourceLine: line,
				isTrailing: parsed.isTrailing,
			}));
		}),
		plugins
	);
}

export function hasDirective(code: string[], name: string): boolean {
	return code.some(line => parseDirectiveComments(line).some(directive => directive.name === name));
}
