import { describe, expect, it } from 'vitest';

import parseMidiInDirectives from './directives';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';

function midiInDirective(args: string[], rawRow = 0): ParsedDirectiveRecord {
	return {
		prefix: '@',
		name: 'midiIn',
		args,
		rawRow,
		sourceLine: `; @midiIn ${args.join(' ')}`,
		isTrailing: false,
	};
}

function codeBlock(id: string, directives: ParsedDirectiveRecord[]): CodeBlockGraphicData {
	return {
		id,
		blockType: 'module',
		parsedDirectives: directives,
	} as unknown as CodeBlockGraphicData;
}

function stateWithBlocks(blocks: CodeBlockGraphicData[]): State {
	return {
		graphicHelper: {
			codeBlocks: blocks,
		},
	} as unknown as State;
}

describe('parseMidiInDirectives', () => {
	it('parses multiple MIDI input bindings, including fan-out on one port', () => {
		const result = parseMidiInDirectives(
			stateWithBlocks([
				codeBlock('foo', [
					midiInDirective(['-1710537465', 'onMidiIn'], 1),
					midiInDirective(['-1710537465', 'onPitchBend'], 2),
					midiInDirective(['input-b', 'onMidiIn'], 3),
				]),
			])
		);

		expect(result.errors).toEqual([]);
		expect(result.bindings).toEqual([
			{
				port: '-1710537465',
				exportName: 'onMidiIn',
				lineNumber: 2,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: '-1710537465',
				exportName: 'onPitchBend',
				lineNumber: 3,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: 'input-b',
				exportName: 'onMidiIn',
				lineNumber: 4,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
		]);
	});

	it('reports malformed directives and duplicate port/callback pairs', () => {
		const result = parseMidiInDirectives(
			stateWithBlocks([
				codeBlock('foo', [
					midiInDirective(['0'], 0),
					midiInDirective(['-1710537465', 'onMidiIn'], 1),
					midiInDirective(['-1710537465', 'onMidiIn'], 2),
				]),
			])
		);

		expect(result.bindings).toEqual([
			{
				port: '-1710537465',
				exportName: 'onMidiIn',
				lineNumber: 2,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
		]);
		expect(result.errors.map(error => error.message)).toEqual([
			'@midiIn requires <port> and <callbackExportName>.',
			'Duplicate @midiIn binding for port "-1710537465" and callback "onMidiIn".',
		]);
	});

	it('keeps raw port strings when deduplicating bindings', () => {
		const result = parseMidiInDirectives(
			stateWithBlocks([
				codeBlock('foo', [midiInDirective(['01', 'onMidiIn'], 0), midiInDirective(['1', 'onMidiIn'], 1)]),
			])
		);

		expect(result.bindings).toEqual([
			{
				port: '01',
				exportName: 'onMidiIn',
				lineNumber: 1,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: '1',
				exportName: 'onMidiIn',
				lineNumber: 2,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
		]);
		expect(result.errors).toEqual([]);
	});
});
