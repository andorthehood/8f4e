import { describe, it, expect } from 'vitest';

import { parseBlockDirectives } from '../parseBlockDirectives';

describe('parseBlockDirectives', () => {
	it('should return an empty array for code with no directives', () => {
		expect(parseBlockDirectives(['module test', 'push 1', 'moduleEnd'])).toEqual([]);
	});

	it('should parse an editor directive (@)', () => {
		expect(parseBlockDirectives(['; @pos 10 20'])).toEqual([
			{ prefix: '@', name: 'pos', args: ['10', '20'], rawRow: 0, sourceLine: '; @pos 10 20', isTrailing: false },
		]);
	});

	it('should parse a runtime directive (~)', () => {
		expect(parseBlockDirectives(['; ~sampleRate 44100'])).toEqual([
			{
				prefix: '~',
				name: 'sampleRate',
				args: ['44100'],
				rawRow: 0,
				sourceLine: '; ~sampleRate 44100',
				isTrailing: false,
			},
		]);
	});

	it('should parse runtime directives with leading whitespace', () => {
		expect(parseBlockDirectives(['  ; ~sampleRate 44100'])).toEqual([
			{
				prefix: '~',
				name: 'sampleRate',
				args: ['44100'],
				rawRow: 0,
				sourceLine: '  ; ~sampleRate 44100',
				isTrailing: false,
			},
		]);
	});

	it('should parse unknown runtime directive names', () => {
		expect(parseBlockDirectives(['; ~runtime WebWorker'])).toEqual([
			{
				prefix: '~',
				name: 'runtime',
				args: ['WebWorker'],
				rawRow: 0,
				sourceLine: '; ~runtime WebWorker',
				isTrailing: false,
			},
		]);
	});

	it('should parse directives with no arguments', () => {
		expect(parseBlockDirectives(['; @disabled'])).toEqual([
			{ prefix: '@', name: 'disabled', args: [], rawRow: 0, sourceLine: '; @disabled', isTrailing: false },
		]);
	});

	it('should parse runtime directives with no arguments', () => {
		expect(parseBlockDirectives(['; ~sampleRate'])).toEqual([
			{ prefix: '~', name: 'sampleRate', args: [], rawRow: 0, sourceLine: '; ~sampleRate', isTrailing: false },
		]);
	});

	it('should record the correct rawRow for each directive', () => {
		const code = ['module test', '; @pos 5 10', 'push 1', '; ~sampleRate 48000', 'moduleEnd'];
		expect(parseBlockDirectives(code)).toEqual([
			{ prefix: '@', name: 'pos', args: ['5', '10'], rawRow: 1, sourceLine: '; @pos 5 10', isTrailing: false },
			{
				prefix: '~',
				name: 'sampleRate',
				args: ['48000'],
				rawRow: 3,
				sourceLine: '; ~sampleRate 48000',
				isTrailing: false,
			},
		]);
	});

	it('should ignore plain comments', () => {
		expect(parseBlockDirectives(['; this is a plain comment'])).toEqual([]);
	});

	it('should ignore non-comment lines', () => {
		expect(parseBlockDirectives(['push 1', 'pop', 'add'])).toEqual([]);
	});

	it('should parse directives with leading whitespace', () => {
		expect(parseBlockDirectives(['   ; @group myGroup'])).toEqual([
			{
				prefix: '@',
				name: 'group',
				args: ['myGroup'],
				rawRow: 0,
				sourceLine: '   ; @group myGroup',
				isTrailing: false,
			},
		]);
	});

	it('should parse multiple directives from a block', () => {
		const code = ['; @pos 0 0', '; @disabled', '; ~sampleRate 44100'];
		expect(parseBlockDirectives(code)).toEqual([
			{ prefix: '@', name: 'pos', args: ['0', '0'], rawRow: 0, sourceLine: '; @pos 0 0', isTrailing: false },
			{ prefix: '@', name: 'disabled', args: [], rawRow: 1, sourceLine: '; @disabled', isTrailing: false },
			{
				prefix: '~',
				name: 'sampleRate',
				args: ['44100'],
				rawRow: 2,
				sourceLine: '; ~sampleRate 44100',
				isTrailing: false,
			},
		]);
	});

	it('should parse trailing inline editor directives', () => {
		expect(parseBlockDirectives(['int foo 1 ; @watch'])).toEqual([
			{ prefix: '@', name: 'watch', args: [], rawRow: 0, sourceLine: 'int foo 1 ; @watch', isTrailing: true },
		]);
	});

	it('should handle an empty code array', () => {
		expect(parseBlockDirectives([])).toEqual([]);
	});
});
