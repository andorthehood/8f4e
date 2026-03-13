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
		apply,
	};
}

export function parseEditorDirectives(code: string[], plugins: EditorDirectivePlugin[]): ParsedEditorDirective[] {
	const pluginNames = new Set(plugins.map(plugin => plugin.name));

	return code.flatMap((line, rawRow) => {
		const parsed = parseDirectiveComment(line);
		if (!parsed || !pluginNames.has(parsed.name)) {
			return [];
		}

		return [
			{
				name: parsed.name,
				rawRow,
				args: parsed.args,
			},
		];
	});
}

export function hasDirective(code: string[], name: string): boolean {
	return code.some(line => parseDirectiveComment(line)?.name === name);
}
