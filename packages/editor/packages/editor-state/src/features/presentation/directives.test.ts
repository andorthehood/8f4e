import { describe, expect, it } from 'vitest';

import { getPresentationStops, parsePresentationDirective } from './directives';

import type { CodeBlockGraphicData } from '~/types';

describe('presentation directives', () => {
	it('parses a valid presentation directive', () => {
		expect(
			parsePresentationDirective([
				{ prefix: '@', name: 'stop', args: ['3', '2.5'], rawRow: 1, isTrailing: false, sourceLine: '; @stop 3 2.5' },
			])
		).toEqual({ order: 3, seconds: 2.5, alignment: 'center' });
	});

	it('parses a valid presentation directive with alignment', () => {
		expect(
			parsePresentationDirective([
				{
					prefix: '@',
					name: 'stop',
					args: ['3', '2.5', 'left'],
					rawRow: 1,
					isTrailing: false,
					sourceLine: '; @stop 3 2.5 left',
				},
			])
		).toEqual({ order: 3, seconds: 2.5, alignment: 'left' });
	});

	it('parses a valid presentation directive with vertical alignment', () => {
		expect(
			parsePresentationDirective([
				{
					prefix: '@',
					name: 'stop',
					args: ['3', '2.5', 'bottom'],
					rawRow: 1,
					isTrailing: false,
					sourceLine: '; @stop 3 2.5 bottom',
				},
			])
		).toEqual({ order: 3, seconds: 2.5, alignment: 'bottom' });
	});

	it('ignores invalid presentation directives', () => {
		expect(
			parsePresentationDirective([
				{
					prefix: '@',
					name: 'stop',
					args: ['first', '2'],
					rawRow: 1,
					isTrailing: false,
					sourceLine: '; @stop first 2',
				},
			])
		).toBeUndefined();
		expect(
			parsePresentationDirective([
				{ prefix: '@', name: 'stop', args: ['1', '0'], rawRow: 1, isTrailing: false, sourceLine: '; @stop 1 0' },
			])
		).toBeUndefined();
		expect(
			parsePresentationDirective([
				{
					prefix: '@',
					name: 'stop',
					args: ['1', '2', 'middle'],
					rawRow: 1,
					isTrailing: false,
					sourceLine: '; @stop 1 2 middle',
				},
			])
		).toBeUndefined();
	});

	it('sorts presentation stops by order and creation index', () => {
		const codeBlocks = [
			{
				creationIndex: 5,
				parsedDirectives: [{ prefix: '@', name: 'stop', args: ['2', '4'], rawRow: 1, isTrailing: false }],
			},
			{
				creationIndex: 2,
				parsedDirectives: [{ prefix: '@', name: 'stop', args: ['1', '3', 'left'], rawRow: 1, isTrailing: false }],
			},
			{
				creationIndex: 3,
				parsedDirectives: [{ prefix: '@', name: 'stop', args: ['2', '1', 'bottom'], rawRow: 1, isTrailing: false }],
			},
		] as CodeBlockGraphicData[];

		expect(
			getPresentationStops(codeBlocks).map(stop => [
				stop.codeBlock.creationIndex,
				stop.order,
				stop.seconds,
				stop.alignment,
			])
		).toEqual([
			[2, 1, 3, 'left'],
			[3, 2, 1, 'bottom'],
			[5, 2, 4, 'center'],
		]);
	});
});
