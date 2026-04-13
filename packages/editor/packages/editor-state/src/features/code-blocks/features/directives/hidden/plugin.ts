import { createDirectivePlugin } from '../utils';

const hiddenDirective = createDirectivePlugin('hidden', (directive, draft) => {
	if (directive.args.length > 0) {
		return;
	}

	draft.blockState.hidden = true;
});

export default hiddenDirective;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('@hidden directive plugin', () => {
		it('marks the block as hidden when present', async () => {
			const { deriveDirectiveState } = await import('../registry');
			const { parseBlockDirectives } = await import('../../../utils/parseBlockDirectives');

			const code = ['module test', '; @hidden', 'moduleEnd'];
			const state = deriveDirectiveState(code, parseBlockDirectives(code), {}, [hiddenDirective]);

			expect(state.blockState.hidden).toBe(true);
		});

		it('ignores directives with arguments', async () => {
			const { deriveDirectiveState } = await import('../registry');
			const { parseBlockDirectives } = await import('../../../utils/parseBlockDirectives');

			const code = ['module test', '; @hidden extra', 'moduleEnd'];
			const state = deriveDirectiveState(code, parseBlockDirectives(code), {}, [hiddenDirective]);

			expect(state.blockState.hidden).toBe(false);
		});
	});
}
