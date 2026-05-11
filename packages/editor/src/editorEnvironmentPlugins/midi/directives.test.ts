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
					midiInDirective(['0', 'onMidiIn'], 1),
					midiInDirective(['0', 'onPitchBend'], 2),
					midiInDirective(['1', 'onMidiIn'], 3),
				]),
			])
		);

		expect(result.errors).toEqual([]);
		expect(result.bindings).toEqual([
			{
				port: '0',
				exportName: 'onMidiIn',
				lineNumber: 2,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: '0',
				exportName: 'onPitchBend',
				lineNumber: 3,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: '1',
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
					midiInDirective(['not-a-number', 'onMidiIn'], 1),
					midiInDirective(['2', 'onMidiIn'], 2),
					midiInDirective(['2', 'onMidiIn'], 3),
				]),
			])
		);

		expect(result.bindings).toEqual([
			{
				port: '2',
				exportName: 'onMidiIn',
				lineNumber: 3,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
		]);
		expect(result.errors.map(error => error.message)).toEqual([
			'@midiIn requires <port> and <callbackExportName>.',
			'@midiIn port must be a non-negative number.',
			'Duplicate @midiIn binding for port "2" and callback "onMidiIn".',
		]);
	});
});
