import type { ProjectModuleBlock, ProjectObjectModel } from '@8f4e/language-spec';
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

/**
 * Serializes a ProjectObjectModel to .8f4e text format.
 * Throws if any code block fails export-gate validation.
 */
export function serializeProjectTo8f4e(project: ProjectObjectModel): string {
	const documentBlocks = [
		...project.includes,
		...project.functions,
		...project.constants,
		...project.prototypes,
		...project.notes,
		...project.unknown,
	];
	const allBlocks = [...documentBlocks, ...project.modules];

	for (let i = 0; i < allBlocks.length; i++) {
		validateCodeBlock(allBlocks[i].code, i);
	}

	const blockStrings = documentBlocks.map(block => block.code.join('\n'));
	const emittedEntries = new Set<string>();
	const modulesByEntry = new Map<string, ProjectModuleBlock[]>();

	for (const module of project.modules) {
		const entryModules = modulesByEntry.get(module.entry) ?? [];
		entryModules.push(module);
		modulesByEntry.set(module.entry, entryModules);
	}

	for (const module of project.modules) {
		if (emittedEntries.has(module.entry)) continue;
		emittedEntries.add(module.entry);
		const entryModules = modulesByEntry.get(module.entry) ?? [];
		blockStrings.push(
			['entry ' + module.entry, ...entryModules.flatMap(moduleBlock => moduleBlock.code), 'entryEnd'].join('\n')
		);
	}

	return FORMAT_HEADER + '\n\n' + blockStrings.join('\n\n');
}
