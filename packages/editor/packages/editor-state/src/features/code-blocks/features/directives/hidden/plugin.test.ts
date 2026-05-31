import { describe, expect, it } from 'vitest';
import hiddenDirective from './plugin';

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
