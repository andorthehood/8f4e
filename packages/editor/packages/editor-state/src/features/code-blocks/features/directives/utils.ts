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

function parseTrailingDirectiveComment(line: string): { name: string; args: string[] } | undefined {
	const commentMatch = line.match(/;\s*@(\w+)(?:\s+(.*))?\s*$/);
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
	options: Pick<EditorDirectivePlugin, 'allowTrailingComment' | 'clearGraphicData'> = {}
): EditorDirectivePlugin {
	return {
		name,
		...options,
		apply,
	};
}

export function parseEditorDirectives(code: string[], plugins: EditorDirectivePlugin[]): ParsedEditorDirective[] {
	const pluginsByName = new Map(plugins.map(plugin => [plugin.name, plugin]));

	return code.flatMap((line, rawRow) => {
		const parsed = parseDirectiveComment(line);
		if (parsed) {
			const plugin = pluginsByName.get(parsed.name);
			if (!plugin) {
				return [];
			}

			return [
				{
					name: parsed.name,
					rawRow,
					args: parsed.args,
					sourceLine: line,
				},
			];
		}

		const trailingParsed = parseTrailingDirectiveComment(line);
		if (!trailingParsed) {
			return [];
		}

		const plugin = pluginsByName.get(trailingParsed.name);
		if (!plugin?.allowTrailingComment) {
			return [];
		}

		return [
			{
				name: trailingParsed.name,
				rawRow,
				args: trailingParsed.args,
				sourceLine: line,
			},
		];
	});
}

export function hasDirective(code: string[], name: string): boolean {
	return code.some(line => parseDirectiveComment(line)?.name === name);
}
