import type { EditorDirectivePlugin, ParsedEditorDirective } from './types';

export function parseDirectiveComment(line: string): { name: string; args: string[] } | undefined {
	const commentMatch = line.match(/^\s*;\s*@(\w+)(?:\s+(.*))?$/);
	if (!commentMatch) {
		return undefined;
	}

	const [, name, rawArgs] = commentMatch;
	return {
		name,
		args: rawArgs ? rawArgs.trim().split(/\s+/) : [],
	};
}

export function createDirectivePlugin(
	name: string,
	apply: NonNullable<EditorDirectivePlugin['apply']>,
	options: Pick<EditorDirectivePlugin, 'clearGraphicData'> = {}
): EditorDirectivePlugin {
	return {
		name,
		...options,
		parse: (line, rawRow) => {
			const parsed = parseDirectiveComment(line);
			if (!parsed || parsed.name !== name) {
				return undefined;
			}

			return {
				name,
				rawRow,
				args: parsed.args,
			};
		},
		apply,
	};
}

export function parseEditorDirectives(code: string[], plugins: EditorDirectivePlugin[]): ParsedEditorDirective[] {
	return code.flatMap((line, rawRow) =>
		plugins
			.map(plugin => plugin.parse(line, rawRow))
			.filter((directive): directive is ParsedEditorDirective => directive !== undefined)
	);
}
