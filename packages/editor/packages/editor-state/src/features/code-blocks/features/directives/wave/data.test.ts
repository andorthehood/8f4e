import { describe, expect, it } from 'vitest';
import { parseEditorDirectives } from '../utils';
import { createWaveDirectiveData } from './data';
import waveDirective, { wave2Directive, wave4Directive } from './plugin';

function parseWaveDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [waveDirective])
		.map(directive => createWaveDirectiveData(directive.args, directive.rawRow))
		.filter(result => result !== undefined);
}

function parseWaveDirectiveDataWithPlugins(code: string[]) {
	const heightRowsByDirective = new Map([
		['wave', 2],
		['wave2', 4],
		['wave4', 8],
	]);

	return parseEditorDirectives(code, [waveDirective, wave2Directive, wave4Directive])
		.map(directive =>
			createWaveDirectiveData(directive.args, directive.rawRow, heightRowsByDirective.get(directive.name))
		)
		.filter(result => result !== undefined);
}

describe('wave directive data', () => {
	it('should parse wave instruction with typed start pointer, element count, and absolute pointer', () => {
		const result = parseWaveDirectiveData(['; @wave bufferAddress 16 playhead']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 16,
				pointerMemoryId: 'playhead',
				lineNumber: 0,
				heightRows: 2,
			},
		]);
	});

	it('should parse wave instruction without a pointer for waveform-only rendering', () => {
		const result = parseWaveDirectiveData(['; @wave bufferAddress 16']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 16,
				pointerMemoryId: undefined,
				lineNumber: 0,
				heightRows: 2,
			},
		]);
	});

	it('should parse wave instruction with an address-of buffer start and a length memory identifier', () => {
		const result = parseWaveDirectiveData(['; @wave &buffer1 length ptr1']);

		expect(result).toEqual([
			{
				startAddressMemoryId: '&buffer1',
				length: 'length',
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
				heightRows: 2,
			},
		]);
	});

	it('should parse wave instruction with a count() length expression', () => {
		const result = parseWaveDirectiveData(['; @wave &buffer1 count(buffer1) ptr1']);

		expect(result).toEqual([
			{
				startAddressMemoryId: '&buffer1',
				length: 'count(buffer1)',
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
				heightRows: 2,
			},
		]);
	});

	it('should handle multiple wave instructions', () => {
		const result = parseWaveDirectiveData(['; @wave bufferAddress 8 ptr1', 'mov a b', '; @wave &buffer2 len2 ptr2']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 8,
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
				heightRows: 2,
			},
			{
				startAddressMemoryId: '&buffer2',
				length: 'len2',
				pointerMemoryId: 'ptr2',
				lineNumber: 2,
				heightRows: 2,
			},
		]);
	});

	it('should return empty array when no wave instructions found', () => {
		expect(parseWaveDirectiveData(['mov a b', 'add c d', 'sub e f'])).toEqual([]);
	});

	it('should handle empty code array', () => {
		expect(parseWaveDirectiveData([])).toEqual([]);
	});

	it('should parse wave instruction at different line positions', () => {
		const result = parseWaveDirectiveData(['mov a b', '; @wave startPtr 32 testPointer', 'add c d']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'startPtr',
				length: 32,
				pointerMemoryId: 'testPointer',
				lineNumber: 1,
				heightRows: 2,
			},
		]);
	});

	it('should parse wave2 with doubled height', () => {
		const result = parseWaveDirectiveDataWithPlugins(['; @wave2 bufferAddress 16 playhead']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 16,
				pointerMemoryId: 'playhead',
				lineNumber: 0,
				heightRows: 4,
			},
		]);
	});

	it('should parse wave4 with quadrupled height', () => {
		const result = parseWaveDirectiveDataWithPlugins(['; @wave4 bufferAddress 16 playhead']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 16,
				pointerMemoryId: 'playhead',
				lineNumber: 0,
				heightRows: 8,
			},
		]);
	});

	it('should ignore malformed wave directives without required arguments', () => {
		expect(parseWaveDirectiveData(['; @wave'])).toEqual([]);
		expect(parseWaveDirectiveData(['; @wave startPtr'])).toEqual([]);
	});

	it('should ignore non-positive literal lengths', () => {
		expect(parseWaveDirectiveData(['; @wave startPtr 0 pointer'])).toEqual([]);
		expect(parseWaveDirectiveData(['; @wave startPtr -1 pointer'])).toEqual([]);
	});
});
