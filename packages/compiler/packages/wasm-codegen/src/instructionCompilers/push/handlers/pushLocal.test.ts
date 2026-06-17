import { localGet } from '@8f4e/compiler-wasm-utils';
import type { ResolvedLocalPushLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext from '../../../testUtils';
import pushLocal from './pushLocal';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

describe('pushLocal', () => {
	it('pushes a local via local.get', () => {
		const local = { kind: 'value', valueType: 'int', index: 3 };
		const context = createInstructionCompilerTestContext({
			locals: {
				temp: local,
			},
		});

		pushLocal(
			{
				lineNumber: 1,
				instruction: 'push',
				arguments: [classifyIdentifier('temp')],
				resolvedTarget: { kind: 'local', localName: 'temp' },
			} as ResolvedLocalPushLine,
			context
		);

		expect(context.byteCode).toEqual(localGet(3));
	});
});
