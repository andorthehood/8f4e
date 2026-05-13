import { describe, expect, it } from 'vitest';

import parseSerialDirectives from './directives';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';

function directive(name: string, args: string[], rawRow = 0): ParsedDirectiveRecord {
	return {
		prefix: '@',
		name,
		args,
		rawRow,
		sourceLine: `; @${name} ${args.join(' ')}`,
		isTrailing: false,
	};
}

function codeBlock(id: string, directives: ParsedDirectiveRecord[]): CodeBlockGraphicData {
	return {
		id,
		moduleId: id,
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

describe('parseSerialDirectives', () => {
	it('parses one serial pipeline with multiple callbacks', () => {
		const result = parseSerialDirectives(
			stateWithBlocks([
				codeBlock('foo', [
					directive('serialIn', ['0', '115200', 'serialBuffer', '32'], 1),
					directive('serialInCallback', ['0', 'onSerialFrame'], 2),
					directive('serialInCallback', ['0', 'onSerialDebug'], 3),
				]),
			])
		);

		expect(result.errors).toEqual([]);
		expect(result.pipelines).toEqual([
			{
				port: '0',
				baudRate: 115200,
				bufferMemoryId: 'serialBuffer',
				frameBytes: 32,
				lineNumber: 2,
				codeBlockId: 'foo',
				codeBlockType: 'module',
				moduleId: 'foo',
			},
		]);
		expect(result.callbacks).toEqual([
			{
				port: '0',
				exportName: 'onSerialFrame',
				lineNumber: 3,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
			{
				port: '0',
				exportName: 'onSerialDebug',
				lineNumber: 4,
				codeBlockId: 'foo',
				codeBlockType: 'module',
			},
		]);
	});

	it('reports malformed directives, duplicate pipelines, and duplicate callbacks', () => {
		const result = parseSerialDirectives(
			stateWithBlocks([
				codeBlock('foo', [
					directive('serialIn', ['0', '115200', 'serialBuffer'], 0),
					directive('serialIn', ['0', '115200', 'serialBuffer', '32'], 1),
					directive('serialIn', ['0', '9600', 'otherBuffer', '16'], 2),
					directive('serialInCallback', ['0', 'onSerialFrame'], 3),
					directive('serialInCallback', ['0', 'onSerialFrame'], 4),
					directive('serialInCallback', ['0'], 5),
				]),
			])
		);

		expect(result.pipelines).toEqual([
			expect.objectContaining({
				port: '0',
				baudRate: 115200,
				bufferMemoryId: 'serialBuffer',
				frameBytes: 32,
			}),
		]);
		expect(result.callbacks).toEqual([
			expect.objectContaining({
				port: '0',
				exportName: 'onSerialFrame',
			}),
		]);
		expect(result.errors.map(error => error.message)).toEqual([
			'@serialIn requires <port> <baudRate> <bufferMemoryId> <frameBytes>.',
			'Duplicate @serialIn binding for port "0".',
			'Duplicate @serialInCallback binding for port "0" and callback "onSerialFrame".',
			'@serialInCallback requires <port> <callbackExportName>.',
		]);
	});

	it('reports callbacks that do not have a matching input pipeline', () => {
		const result = parseSerialDirectives(
			stateWithBlocks([codeBlock('foo', [directive('serialInCallback', ['1', 'onSerialFrame'], 0)])])
		);

		expect(result.pipelines).toEqual([]);
		expect(result.callbacks).toEqual([
			expect.objectContaining({
				port: '1',
				exportName: 'onSerialFrame',
			}),
		]);
		expect(result.errors.map(error => error.message)).toEqual([
			'@serialInCallback references port "1" without a matching @serialIn directive.',
		]);
	});
});
