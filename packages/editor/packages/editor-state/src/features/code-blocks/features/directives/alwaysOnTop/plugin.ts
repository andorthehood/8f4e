import { createDirectivePlugin } from '../utils';

export default createDirectivePlugin('alwaysOnTop', (_directive, draft) => {
	draft.blockState.alwaysOnTop = true;
});

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { deriveDirectiveState } = await import('../registry');
	const { parseBlockDirectives } = await import('../../../utils/parseBlockDirectives');
	const alwaysOnTopPlugin = (await import('./plugin')).default;

	function runDerive(code: string[]) {
		const parsedDirectives = parseBlockDirectives(code);
		return deriveDirectiveState(code, parsedDirectives, {}, [alwaysOnTopPlugin]);
	}

	describe('@alwaysOnTop directive plugin', () => {
		it('sets alwaysOnTop to true when directive is present', () => {
			const state = runDerive(['module test', '; @alwaysOnTop', 'moduleEnd']);
			expect(state.blockState.alwaysOnTop).toBe(true);
		});

		it('leaves alwaysOnTop undefined when directive is absent', () => {
			const state = runDerive(['module test', 'moduleEnd']);
			expect(state.blockState.alwaysOnTop).toBeUndefined();
		});

		it('ignores extra arguments', () => {
			const state = runDerive(['module test', '; @alwaysOnTop ignored', 'moduleEnd']);
			expect(state.blockState.alwaysOnTop).toBe(true);
		});

		it('uses first @alwaysOnTop directive and ignores duplicates', () => {
			const state = runDerive(['module test', '; @alwaysOnTop', '; @alwaysOnTop', 'moduleEnd']);
			expect(state.blockState.alwaysOnTop).toBe(true);
		});
	});
}
