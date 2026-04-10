import { defaultColorScheme } from '@8f4e/sprite-generator';

import { formatDidYouMeanSuffix } from '../suggestions';
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

function collectColorPaths(value: Record<string, unknown>, prefix = ''): string[] {
	const paths: string[] = [];

	for (const [key, child] of Object.entries(value)) {
		const nextPath = prefix ? `${prefix}.${key}` : key;
		if (typeof child === 'string') {
			paths.push(nextPath);
			continue;
		}

		if (child && typeof child === 'object' && !Array.isArray(child)) {
			paths.push(...collectColorPaths(child as Record<string, unknown>, nextPath));
		}
	}

	return paths;
}

const COLOR_PATHS = collectColorPaths(defaultColorScheme as unknown as Record<string, unknown>);

function applyColorOverride(colorScheme: ColorScheme, path: string, value: string): void {
	let current: Record<string, unknown> = colorScheme as unknown as Record<string, unknown>;
	const segments = path.split('.');

	for (let i = 0; i < segments.length - 1; i++) {
		const next = current[segments[i]];
		current = next as Record<string, unknown>;
	}

	const leaf = segments[segments.length - 1];
	current[leaf] = value;
}

export default createGlobalEditorDirectivePlugin('color', (directive, draft, context) => {
	if (directive.args.length === 0) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@color requires exactly 2 arguments: <path> <value>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const [path, value] = directive.args;
	if (!COLOR_PATHS.includes(path)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@color: unknown color path '${path}'${formatDidYouMeanSuffix(path, COLOR_PATHS)}`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	if (directive.args.length !== 2) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: '@color requires exactly 2 arguments: <path> <value>',
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	if (!isValidColorValue(value)) {
		draft.errors.push({
			lineNumber: directive.rawRow,
			message: `@color: invalid color value '${value}'`,
			codeBlockId: context.codeBlockId,
		});
		return;
	}

	const nextColorScheme = draft.resolved.colorScheme ?? cloneDefaultColorScheme();
	applyColorOverride(nextColorScheme, path, value);
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

		it('suggests the closest supported color path for typos', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [
							{ prefix: '@', name: 'color', args: ['text.cod', '#000000'], rawRow: 1, isTrailing: false },
						],
					},
				],
				{}
			);

			expect(result.resolved.colorScheme).toBeUndefined();
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain("Did you mean 'text.code'?");
		});

		it('prioritizes invalid path suggestions over missing value errors', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [{ prefix: '@', name: 'color', args: ['text.cod'], rawRow: 1, isTrailing: false }],
					},
				],
				{}
			);

			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toContain("@color: unknown color path 'text.cod'");
			expect(result.errors[0].message).toContain("Did you mean 'text.code'?");
		});

		it('still reports a missing value when the color path is valid', async () => {
			const { resolveGlobalEditorDirectives } = await import('../registry');

			const result = resolveGlobalEditorDirectives(
				[
					{
						parsedDirectives: [{ prefix: '@', name: 'color', args: ['text.code'], rawRow: 1, isTrailing: false }],
					},
				],
				{}
			);

			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].message).toBe('@color requires exactly 2 arguments: <path> <value>');
		});
	});
}
