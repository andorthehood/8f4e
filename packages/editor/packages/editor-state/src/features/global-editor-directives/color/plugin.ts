import { defaultColorScheme } from '@8f4e/sprite-generator';

import { createGlobalEditorDirectivePlugin } from '../utils';

import type { ColorScheme } from '@8f4e/sprite-generator';

function cloneDefaultColorScheme(): ColorScheme {
	return {
		text: { ...defaultColorScheme.text },
		fill: { ...defaultColorScheme.fill },
		icons: { ...defaultColorScheme.icons },
	};
}

function isValidColorValue(value: string): boolean {
	if (value.length === 0) {
		return false;
	}

	return /^#[0-9a-fA-F]{3,8}$/.test(value) || /^(rgb|rgba|hsl|hsla)\([^)]*\)$/.test(value) || /^[a-zA-Z]+$/.test(value);
}

function applyColorOverride(colorScheme: ColorScheme, path: string, value: string): boolean {
	const segments = path.split('.');
	if (segments.length < 2) {
		return false;
	}

	let current: Record<string, unknown> = colorScheme as unknown as Record<string, unknown>;

	for (let i = 0; i < segments.length - 1; i++) {
		const next = current[segments[i]];
		if (!next || typeof next !== 'object' || Array.isArray(next)) {
			return false;
		}
		current = next as Record<string, unknown>;
	}

	const leaf = segments[segments.length - 1];
	if (typeof current[leaf] !== 'string') {
		return false;
	}

	current[leaf] = value;
	return true;
}

export default createGlobalEditorDirectivePlugin('color', (directive, draft, context) => {
	if (directive.args.length !== 2) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@color requires exactly 2 arguments: <path> <value>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const [path, value] = directive.args;
	if (!isValidColorValue(value)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@color: invalid color value '${value}'`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const nextColorScheme = draft.resolved.colorScheme ?? cloneDefaultColorScheme();
	if (!applyColorOverride(nextColorScheme, path, value)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@color: unknown color path '${path}'`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	draft.resolved.colorScheme = nextColorScheme;
});

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('@color global editor directive', () => {
		it('applies valid color overrides', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [
							{ prefix: '@', name: 'color', args: ['text.code', '#112233'], rawRow: 1, isTrailing: false },
							{ prefix: '@', name: 'color', args: ['fill.wire', 'rgba(1,2,3,0.4)'], rawRow: 2, isTrailing: false },
						],
					},
				],
				{}
			);

			expect(result.resolved.colorScheme?.text.code).toBe('#112233');
			expect(result.resolved.colorScheme?.fill.wire).toBe('rgba(1,2,3,0.4)');
			expect(result.errors).toEqual([]);
		});

		it('uses last-write-wins for duplicate paths', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [
							{ prefix: '@', name: 'color', args: ['text.code', '#111111'], rawRow: 1, isTrailing: false },
							{ prefix: '@', name: 'color', args: ['text.code', '#222222'], rawRow: 2, isTrailing: false },
						],
					},
				],
				{}
			);

			expect(result.resolved.colorScheme?.text.code).toBe('#222222');
			expect(result.errors).toEqual([]);
		});

		it('reports invalid paths and values', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						id: 'colors',
						parsedDirectives: [
							{ prefix: '@', name: 'color', args: ['bad.path', '#000000'], rawRow: 1, isTrailing: false },
							{ prefix: '@', name: 'color', args: ['text.code', '???'], rawRow: 2, isTrailing: false },
						],
					},
				],
				{}
			);

			expect(result.resolved.colorScheme).toBeUndefined();
			expect(result.errors).toEqual([
				{
					lineNumber: 1,
					message: "@color: unknown color path 'bad.path'",
					codeBlockId: 'colors',
				},
				{
					lineNumber: 2,
					message: "@color: invalid color value '???'",
					codeBlockId: 'colors',
				},
			]);
		});
	});
}
