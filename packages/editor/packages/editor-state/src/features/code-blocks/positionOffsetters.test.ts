import { describe, expect, it } from 'vitest';
import { parsePositionOffsetters } from './positionOffsetters';
import { parseBlockDirectives } from './utils/parseBlockDirectives';

describe('position offset directive arguments', () => {
	it('accepts an axis and a plain memory target', () => {
		expect(parsePositionOffsetters(parseBlockDirectives(['; @offset x otherModule:offset']))).toEqual([
			{ axis: 'x', memory: 'otherModule:offset' },
		]);
	});

	it('rejects operators, invalid axes, and extra arguments', () => {
		expect(parsePositionOffsetters(parseBlockDirectives(['; @offset x &offset']))).toEqual([]);
		expect(parsePositionOffsetters(parseBlockDirectives(['; @offset x *offset']))).toEqual([]);
		expect(parsePositionOffsetters(parseBlockDirectives(['; @offset z offset']))).toEqual([]);
		expect(parsePositionOffsetters(parseBlockDirectives(['; @offset x offset extra']))).toEqual([]);
	});
});
