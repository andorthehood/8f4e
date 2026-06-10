import type { CodeBlock, Project } from '@8f4e/editor-state-types';
import { getDocumentProjectBlockType } from '@8f4e/tokenizer';
import { FORMAT_HEADER, getCloserKeyword, getExpectedCloserPrefix, getOpenerKeyword } from '../project-format';

function validateCodeBlock(code: string[], blockIndex: number): void {
	// Find first non-empty line (must be opener)
	const firstNonEmptyLine = code.find(line => line.trim() !== '');
	if (!firstNonEmptyLine) {
		throw new Error(`Block ${blockIndex}: block has no content`);
	}

	const opener = getOpenerKeyword(firstNonEmptyLine.trim());
	if (!opener) {
		throw new Error(`Block ${blockIndex}: unknown or missing opener "${firstNonEmptyLine.trim()}"`);
	}

	const expectedCloserPrefix = getExpectedCloserPrefix(opener);
	const firstLineIndex = code.indexOf(firstNonEmptyLine);

	// Find last non-empty line (must be matching closer)
	let lastNonEmptyIndex = code.length - 1;
	while (lastNonEmptyIndex >= 0 && code[lastNonEmptyIndex].trim() === '') {
		lastNonEmptyIndex--;
	}

	if (lastNonEmptyIndex < 0) {
		throw new Error(`Block ${blockIndex}: missing closer`);
	}

	const closerLine = code[lastNonEmptyIndex].trim();
	const closer = getCloserKeyword(closerLine);
	if (!closer) {
		throw new Error(`Block ${blockIndex}: unknown or missing closer "${closerLine}"`);
	}

	if (!closer.startsWith(expectedCloserPrefix)) {
		throw new Error(`Block ${blockIndex}: opener/closer mismatch (opener "${opener}", closer "${closer}")`);
	}

	// Scan inside block for mixed markers or early closer
	for (let i = firstLineIndex + 1; i < lastNonEmptyIndex; i++) {
		const lineTrimmed = code[i].trim();
		if (lineTrimmed === '') continue;

		const innerOpener = getOpenerKeyword(lineTrimmed);
		if (innerOpener) {
			throw new Error(
				`Block ${blockIndex}: mixed block type markers (found opener "${lineTrimmed}" inside "${opener}" block)`
			);
		}

		const innerCloser = getCloserKeyword(lineTrimmed);
		if (innerCloser) {
			throw new Error(`Block ${blockIndex}: closer "${lineTrimmed}" is not at the end of the block`);
		}
	}
}

function getModuleEntryName(block: CodeBlock, blockIndex: number): string {
	if (!block.entry) {
		throw new Error(`Block ${blockIndex}: module block is missing entry`);
	}
	return block.entry;
}

function getIncludeIds(project: Project): string[] {
	const seen = new Set<string>();
	const includeIds: string[] = [];

	for (const block of project.includedFunctionBlocks ?? []) {
		if (block.source?.kind !== 'include') {
			continue;
		}

		const includeId = block.source.includeId;
		if (seen.has(includeId)) {
			continue;
		}

		seen.add(includeId);
		includeIds.push(includeId);
	}

	return includeIds;
}

/**
 * Serializes a Project to .8f4e text format.
 * Throws if any code block fails export-gate validation.
 */
export function serializeProjectTo8f4e(project: Project): string {
	const { codeBlocks } = project;

	for (let i = 0; i < codeBlocks.length; i++) {
		validateCodeBlock(codeBlocks[i].code, i);
	}

	const blockStrings: string[] = [];
	const includeIds = getIncludeIds(project);
	const emittedEntries = new Set<string>();
	const modulesByEntry = new Map<string, Project['codeBlocks']>();

	if (includeIds.length > 0) {
		blockStrings.push(['includes', ...includeIds.map(includeId => `include ${includeId}`), 'includesEnd'].join('\n'));
	}

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex += 1) {
		const block = codeBlocks[blockIndex];
		if (getDocumentProjectBlockType(block.code) !== 'module') {
			continue;
		}

		const entryName = getModuleEntryName(block, blockIndex);
		const entryModules = modulesByEntry.get(entryName) ?? [];
		entryModules.push(block);
		modulesByEntry.set(entryName, entryModules);
	}

	for (let blockIndex = 0; blockIndex < codeBlocks.length; blockIndex += 1) {
		const block = codeBlocks[blockIndex];
		if (getDocumentProjectBlockType(block.code) !== 'module') {
			blockStrings.push(block.code.join('\n'));
			continue;
		}

		const entryName = getModuleEntryName(block, blockIndex);
		if (emittedEntries.has(entryName)) {
			continue;
		}

		emittedEntries.add(entryName);
		const modules = modulesByEntry.get(entryName) ?? [];
		blockStrings.push(
			['entry ' + entryName, ...modules.flatMap(moduleBlock => moduleBlock.code), 'entryEnd'].join('\n')
		);
	}

	return FORMAT_HEADER + '\n\n' + blockStrings.join('\n\n');
}
