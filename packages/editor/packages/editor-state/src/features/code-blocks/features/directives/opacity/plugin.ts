import { createDirectivePlugin } from '../utils';

function parseOpacity(value: string | undefined): number | undefined {
	if (value === undefined) {
		return undefined;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
		return undefined;
	}

	return parsed;
}

export default createDirectivePlugin('opacity', (directive, draft) => {
	const draftWithMarker = draft as typeof draft & { _opacitySeen?: boolean };

	// Only process the first valid @opacity directive.
	if (draftWithMarker._opacitySeen) {
		return;
	}

	const opacity = parseOpacity(directive.args[0]);
	if (opacity === undefined) {
		return;
	}

	draftWithMarker._opacitySeen = true;
	draft.blockState.opacity = opacity;
});

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { deriveDirectiveState } = await import('../registry');
	const { parseBlockDirectives } = await import('../../../utils/parseBlockDirectives');
	const opacityPlugin = (await import('./plugin')).default;

	function runDerive(code: string[]) {
		const parsedDirectives = parseBlockDirectives(code);
		return deriveDirectiveState(code, parsedDirectives, {}, [opacityPlugin]);
	}

	describe('@opacity directive plugin', () => {
		it('parses opacity 0', () => {
			const state = runDerive(['module test', '; @opacity 0', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(0);
		});

		it('parses opacity 1', () => {
			const state = runDerive(['module test', '; @opacity 1', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});

		it('parses fractional opacity', () => {
			const state = runDerive(['module test', '; @opacity 0.35', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(0.35);
		});

		it('defaults to 1 when absent', () => {
			const state = runDerive(['module test', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});

		it('ignores values below 0', () => {
			const state = runDerive(['module test', '; @opacity -0.1', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});

		it('ignores values above 1', () => {
			const state = runDerive(['module test', '; @opacity 1.1', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});

		it('ignores missing values', () => {
			const state = runDerive(['module test', '; @opacity', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});

		it('uses the first valid @opacity directive and ignores later ones', () => {
			const state = runDerive(['module test', '; @opacity 0.4', '; @opacity 0.7', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(0.4);
		});

		it('keeps the first valid directive even when it is 1', () => {
			const state = runDerive(['module test', '; @opacity 1', '; @opacity 0.2', 'moduleEnd']);
			expect(state.blockState.opacity).toBe(1);
		});
	});
}
