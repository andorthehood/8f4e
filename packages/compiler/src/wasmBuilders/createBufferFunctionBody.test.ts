import { describe, expect, test } from 'vitest';

import createBufferFunctionBody from './createBufferFunctionBody';

describe('createBufferFunctionBody', () => {
	test('unrolled strategy generates repeated call instructions', () => {
		const result = createBufferFunctionBody(3, 'unrolled', 1);
		expect(result).toMatchSnapshot();
	});

	test('loop strategy generates loop control flow', () => {
		const result = createBufferFunctionBody(128, 'loop', 1);
		expect(result).toMatchSnapshot();
	});

	test('loop strategy with custom buffer size', () => {
		const result = createBufferFunctionBody(256, 'loop', 1);
		expect(result).toMatchSnapshot();
	});

	test('default parameters use loop strategy with bufferSize 128', () => {
		const result = createBufferFunctionBody();
		expect(result).toMatchSnapshot();
	});
});
