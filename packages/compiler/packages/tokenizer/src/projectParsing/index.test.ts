import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

import parse8f4eProject, {
	BLOCK_DELIMITERS,
	FORMAT_HEADER,
	getDocumentProjectBlockType,
	getExpectedProjectCloserPrefix,
	getProjectBlockType,
	getProjectCloserKeyword,
	getProjectOpenerKeyword,
	pickProjectCompilerBlocks,
} from './index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDirectory = path.join(__dirname, 'fixtures');
const snapshotDirectory = path.join(__dirname, '__snapshots__');

const validModuleBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validMacroBlock = ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'];
const validPrototypeBlock = ['prototype oscillatorState', 'float phase', 'float frequency 440', 'prototypeEnd'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

function readProjectFixtureNames(): string[] {
	return readdirSync(fixtureDirectory, { withFileTypes: true })
		.filter(entry => entry.isFile() && entry.name.endsWith('.8f4e'))
		.map(entry => entry.name)
		.sort();
}

function readProjectFixture(name: string): string {
	return readFileSync(path.join(fixtureDirectory, name), 'utf8');
}

function getSnapshotPath(fixtureName: string, snapshotName: string): string {
	return path.join(snapshotDirectory, `${fixtureName}.${snapshotName}.snap`);
}

describe('projectParsing index', () => {
	it('exports the project parser subsystem surface', () => {
		const project = parse8f4eProject(
			['8f4e/v1', '', 'entry main', 'module counter', 'moduleEnd', 'entryEnd'].join('\n')
		);

		expect(FORMAT_HEADER).toBe('8f4e/v1');
		expect(BLOCK_DELIMITERS.length).toBeGreaterThan(0);
		expect(getProjectOpenerKeyword('group audio')).toBe('group');
		expect(getProjectCloserKeyword('groupEnd')).toBe('groupEnd');
		expect(getExpectedProjectCloserPrefix('entry')).toBe('entryEnd');
		expect(getDocumentProjectBlockType(project.codeBlocks[0].code)).toBe('module');
		expect(getProjectBlockType(project.codeBlocks[0].code)).toBe('module');
		expect(pickProjectCompilerBlocks(project).entries.main).toEqual([
			{ code: ['module counter', 'moduleEnd'], projectBlockId: 4 },
		]);
	});
});

describe('parse8f4eProject', () => {
	it('parses multiple document blocks', () => {
		const text = [
			'8f4e/v1',
			'',
			'; project comment before an entry',
			'entry main',
			'; entry comment before a module',
			...validModuleBlock,
			'// entry comment before closing',
			'entryEnd',
			'',
			'# project directive-style comment before a function',
			...validFunctionBlock,
			'',
			...validPrototypeBlock,
			'',
			...validNoteBlock,
			'; trailing project comment',
		].join('\n');
		const project = parse8f4eProject(text);

		expect(project.codeBlocks).toEqual([
			{ id: 6, code: validModuleBlock, entry: 'main' },
			{ id: 15, code: validFunctionBlock },
			{ id: 19, code: validPrototypeBlock },
			{ id: 24, code: validNoteBlock },
		]);
		expect(project.groups).toEqual([]);
	});

	it('marks parsed module blocks that contain shape instructions', () => {
		const project = parse8f4eProject(
			['8f4e/v1', '', 'entry main', 'module oscillator', 'shape oscillatorState', 'moduleEnd', 'entryEnd'].join('\n')
		);

		expect(project.codeBlocks[0]).toEqual({
			id: 4,
			code: ['module oscillator', 'shape oscillatorState', 'moduleEnd'],
			entry: 'main',
		});
	});

	it('allows empty entries', () => {
		const project = parse8f4eProject(['8f4e/v1', '', 'entry main', 'entryEnd'].join('\n'));

		expect(project.codeBlocks).toEqual([]);
		expect(project.groups).toEqual([]);
	});

	it('parses empty files with only a header', () => {
		expect(parse8f4eProject('8f4e/v1\n').codeBlocks).toEqual([]);
		expect(parse8f4eProject('8f4e/v1\n').groups).toEqual([]);
	});

	it('parses nested groups under entries', () => {
		const project = parse8f4eProject(
			[
				'8f4e/v1',
				'',
				'entry main',
				'group audio',
				...validModuleBlock,
				...validFunctionBlock,
				'group oscillator',
				...validPrototypeBlock,
				...validMacroBlock,
				'groupEnd',
				'groupEnd',
				'entryEnd',
			].join('\n')
		);

		expect(project.codeBlocks).toEqual([]);
		expect(project.groups).toEqual([
			{
				name: 'audio',
				entry: 'main',
				codeBlocks: [
					{ id: 5, code: validModuleBlock, entry: 'main' },
					{ id: 10, code: validFunctionBlock, entry: 'main' },
				],
				groups: [
					{
						name: 'oscillator',
						entry: 'main',
						codeBlocks: [
							{ id: 14, code: validPrototypeBlock, entry: 'main' },
							{ id: 18, code: validMacroBlock, entry: 'main' },
						],
						groups: [],
					},
				],
			},
		]);
	});

	it('throws on invalid project shape', () => {
		expect(() => parse8f4eProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nsome code')).toThrow('unclosed block');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nfunctionEnd')).toThrow('does not match opener');
		expect(() => parse8f4eProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		expect(() => parse8f4eProject('8f4e/v1\n\nmodule foo\nmoduleEnd')).toThrow(
			'module blocks must be inside an entry block'
		);
		expect(() =>
			parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nfunction bar\nfunctionEnd\nmoduleEnd\nentryEnd')
		).toThrow('mixed block type markers');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nfunction foo\nfunctionEnd\nentryEnd')).toThrow(
			'can only contain module or group blocks'
		);
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nentryEnd\n\nentry main\nentryEnd')).toThrow(
			'duplicate entry'
		);
		expect(() => parse8f4eProject('8f4e/v1\n\ngroup audio\ngroupEnd')).toThrow(
			'group blocks must be inside an entry block'
		);
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\ngroup\ngroupEnd\nentryEnd')).toThrow(
			'group requires exactly one name'
		);
		expect(() =>
			parse8f4eProject('8f4e/v1\n\nentry main\ngroup audio\nentry nested\nentryEnd\ngroupEnd\nentryEnd')
		).toThrow('entry blocks cannot be nested inside groups');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\ngroup audio\nmoduleEnd\ngroupEnd\nentryEnd')).toThrow(
			'does not match opener "group"'
		);
	});
});

describe('parse8f4eProject fixtures', () => {
	const fixtureNames = readProjectFixtureNames();

	it('has project fixtures', () => {
		expect(fixtureNames.length).toBeGreaterThan(0);
	});

	it.each(fixtureNames)('matches parser snapshots for %s', async fixtureName => {
		const project = parse8f4eProject(readProjectFixture(fixtureName));

		await expect(project).toMatchFileSnapshot(getSnapshotPath(fixtureName, 'project'));
		await expect(pickProjectCompilerBlocks(project)).toMatchFileSnapshot(
			getSnapshotPath(fixtureName, 'compiler-blocks')
		);
	});
});
