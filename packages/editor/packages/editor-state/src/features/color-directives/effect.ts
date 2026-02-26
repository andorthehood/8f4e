import { StateManager } from '@8f4e/state-manager';
import { defaultColorScheme } from '@8f4e/sprite-generator';

import deepEqual from '../config-compiler/utils/deepEqual';

import type { ColorScheme } from '@8f4e/sprite-generator';
import type { State } from '~/types';
import type { CodeBlockGraphicData } from '../code-blocks/types';

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

function compileColorSchemeFromDirectives(codeBlocks: CodeBlockGraphicData[]): ColorScheme {
	const nextColorScheme = cloneDefaultColorScheme();

	for (const codeBlock of codeBlocks) {
		for (const line of codeBlock.code) {
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (!commentMatch || commentMatch[1] !== 'color') {
				continue;
			}

			const args = commentMatch[2].trim().split(/\s+/);
			if (args.length !== 2) {
				console.warn('Invalid @color directive (expected: ; @color <path> <value>):', line);
				continue;
			}

			const [path, value] = args;
			if (!isValidColorValue(value)) {
				console.warn('Invalid @color value:', value);
				continue;
			}

			if (!applyColorOverride(nextColorScheme, path, value)) {
				console.warn('Unknown @color path:', path);
			}
		}
	}

	return nextColorScheme;
}

export default function colorDirectivesEffect(store: StateManager<State>): void {
	function updateColorSchemeFromDirectives(): void {
		const state = store.getState();
		const nextColorScheme = compileColorSchemeFromDirectives(state.graphicHelper.codeBlocks);

		if (!deepEqual(nextColorScheme, state.colorScheme)) {
			store.set('colorScheme', nextColorScheme);
		}
	}

	updateColorSchemeFromDirectives();
	store.subscribe('graphicHelper.codeBlocks', updateColorSchemeFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlock.code', updateColorSchemeFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', updateColorSchemeFromDirectives);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('compileColorSchemeFromDirectives', () => {
		it('applies valid @color directives', () => {
			const codeBlocks = [
				{
					id: 'block',
					code: ['comment', '; @color text.code #112233', '; @color fill.wire rgba(1,2,3,0.4)', 'commentEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = compileColorSchemeFromDirectives(codeBlocks);
			expect(result.text.code).toBe('#112233');
			expect(result.fill.wire).toBe('rgba(1,2,3,0.4)');
		});

		it('uses last-write-wins for duplicate paths', () => {
			const codeBlocks = [
				{
					id: 'block',
					code: ['comment', '; @color text.code #111111', '; @color text.code #222222', 'commentEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = compileColorSchemeFromDirectives(codeBlocks);
			expect(result.text.code).toBe('#222222');
		});

		it('ignores invalid paths and values', () => {
			const codeBlocks = [
				{
					id: 'block',
					code: ['comment', '; @color bad.path #000000', '; @color text.code ???', 'commentEnd'],
				},
			] as CodeBlockGraphicData[];

			const result = compileColorSchemeFromDirectives(codeBlocks);
			expect(result.text.code).toBe(defaultColorScheme.text.code);
		});
	});
}
