import { describe, expect, it } from 'vitest';

const { deriveDirectiveState } = await import('../registry');
const { parseBlockDirectives } = await import('../../../utils/parseBlockDirectives');
const viewportPlugin = (await import('./plugin')).default;

function runDerive(code: string[]) {
	const parsedDirectives = parseBlockDirectives(code);
	return deriveDirectiveState(code, parsedDirectives, {}, [viewportPlugin]);
}

describe('@viewport directive plugin', () => {
	it('parses top-left anchor', () => {
		const state = runDerive(['module test', '; @viewport top-left', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBe('top-left');
	});

	it('parses top-right anchor', () => {
		const state = runDerive(['module test', '; @viewport top-right', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBe('top-right');
	});

	it('parses bottom-left anchor', () => {
		const state = runDerive(['module test', '; @viewport bottom-left', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBe('bottom-left');
	});

	it('parses bottom-right anchor', () => {
		const state = runDerive(['module test', '; @viewport bottom-right', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBe('bottom-right');
	});

	it('returns undefined when directive is absent', () => {
		const state = runDerive(['module test', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBeUndefined();
	});

	it('returns undefined for unknown anchor value', () => {
		const state = runDerive(['module test', '; @viewport center', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBeUndefined();
	});

	it('returns undefined when @viewport has no arguments', () => {
		const state = runDerive(['module test', '; @viewport', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBeUndefined();
	});

	it('uses first @viewport directive and ignores duplicates', () => {
		const state = runDerive(['module test', '; @viewport top-left', '; @viewport bottom-right', 'moduleEnd']);
		expect(state.blockState.viewportAnchor).toBe('top-left');
	});
});
