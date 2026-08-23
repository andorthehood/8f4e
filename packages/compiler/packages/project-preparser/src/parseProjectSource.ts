import type { DocumentBlockType, ProjectBlock, ProjectObjectModel } from '@8f4e/language-spec';
import { documentBlockInstructionByType, documentBlockInstructionPairs } from '@8f4e/language-spec';
import { ENTRY_BLOCK_DELIMITER, FORMAT_HEADER, GROUP_BLOCK_DELIMITER } from './delimiters';
import { getExpectedProjectCloserPrefix, getProjectCloserKeyword, getProjectOpenerKeyword } from './projectKeywords';
import { getProjectBlockName, isProjectGapLine } from './projectLines';

type ProjectContainerDelimiter = { opener: string; closer: string };
type ProjectContainerContentOptions = {
	project: ProjectObjectModel;
	entry: string;
	container: ProjectContainerDelimiter;
	validateDocumentOpener: (opener: string, line: string, lineNumber: number) => void;
};
type ParsedProjectBlock = { block: ProjectBlock; type: DocumentBlockType; nextIndex: number };

function createEmptyProject(metadata: Pick<ProjectObjectModel, 'name' | 'entry'> = {}): ProjectObjectModel {
	return {
		...metadata,
		modules: [],
		functions: [],
		constants: [],
		prototypes: [],
		includes: [],
		notes: [],
		unknown: [],
		groups: [],
	};
}

function hasDisabledDirective(code: readonly string[]): boolean {
	return code.some(line => /^\s*;\s*@disabled(?:\s|$)/.test(line));
}

/** Parses `.8f4e` text into the canonical compiler-owned project object model. */
export function parseProjectSource(text: string): ProjectObjectModel {
	const lines = text.split('\n');
	if (lines[0]?.trim() !== FORMAT_HEADER) {
		throw new Error(`Invalid .8f4e file: expected header "${FORMAT_HEADER}", got "${lines[0]?.trim() ?? ''}"`);
	}

	const project = createEmptyProject();
	const seenEntryNames = new Set<string>();

	function addParsedBlock(targetProject: ProjectObjectModel, parsed: ParsedProjectBlock, entry?: string): void {
		const { block, type } = parsed;
		if (type === 'module') {
			if (!entry) throw new Error(`Project module block ${block.id} is missing an entry`);
			targetProject.modules.push({ ...block, entry });
			return;
		}
		const collectionByType = {
			function: targetProject.functions,
			constants: targetProject.constants,
			prototype: targetProject.prototypes,
			includes: targetProject.includes,
			note: targetProject.notes,
		};
		collectionByType[type].push(block);
	}

	function readProjectBlock(startIndex: number): ParsedProjectBlock {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (
			!openerKeyword ||
			openerKeyword === ENTRY_BLOCK_DELIMITER.opener ||
			openerKeyword === GROUP_BLOCK_DELIMITER.opener
		) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected document block opener`);
		}
		const blockType = documentBlockInstructionPairs.find(({ start }) => start === openerKeyword)?.type;
		if (!blockType) {
			throw new Error(`Parse error at line ${startIndex + 1}: unknown document block opener "${openerKeyword}"`);
		}

		const expectedCloser = getExpectedProjectCloserPrefix(openerKeyword);
		const currentBlockLines = [openerLine];
		for (let i = startIndex + 1; i < lines.length; i += 1) {
			const line = lines[i];
			const trimmed = line.trim();
			currentBlockLines.push(line);
			const closer = getProjectCloserKeyword(trimmed);
			if (closer) {
				if (closer !== expectedCloser) {
					throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
				}
				return {
					block: {
						id: startIndex + 1,
						code: currentBlockLines,
						...(hasDisabledDirective(currentBlockLines) ? { disabled: true } : {}),
					},
					type: blockType,
					nextIndex: i + 1,
				};
			}
			if (trimmed !== '' && getProjectOpenerKeyword(trimmed)) {
				throw new Error(
					`Parse error at line ${i + 1}: mixed block type markers (found opener "${trimmed}" inside "${openerKeyword}" block)`
				);
			}
		}
		throw new Error(`Parse error: unclosed block with opener "${openerKeyword}"`);
	}

	function readProjectContainerContents(startIndex: number, options: ProjectContainerContentOptions): number {
		for (let i = startIndex; i < lines.length; ) {
			const trimmed = lines[i].trim();
			if (isProjectGapLine(trimmed)) {
				i += 1;
				continue;
			}
			const closer = getProjectCloserKeyword(trimmed);
			if (closer === options.container.closer) return i + 1;
			if (closer) {
				throw new Error(
					`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${options.container.opener}"`
				);
			}

			const opener = getProjectOpenerKeyword(trimmed);
			if (!opener) throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
			if (opener === GROUP_BLOCK_DELIMITER.opener) {
				const nested = readProjectGroup(i, options.entry);
				options.project.groups.push(nested.group);
				i = nested.nextIndex;
				continue;
			}

			options.validateDocumentOpener(opener, trimmed, i + 1);
			const parsed = readProjectBlock(i);
			addParsedBlock(options.project, parsed, options.entry);
			i = parsed.nextIndex;
		}
		throw new Error(`Parse error: unclosed block with opener "${options.container.opener}"`);
	}

	function readProjectGroup(startIndex: number, entry: string): { nextIndex: number; group: ProjectObjectModel } {
		const openerLine = lines[startIndex];
		if (getProjectOpenerKeyword(openerLine.trim()) !== GROUP_BLOCK_DELIMITER.opener) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected group opener`);
		}
		const group = createEmptyProject({
			name: getProjectBlockName(openerLine, startIndex + 1, 'group'),
			entry,
		});
		return {
			nextIndex: readProjectContainerContents(startIndex + 1, {
				project: group,
				entry,
				container: GROUP_BLOCK_DELIMITER,
				validateDocumentOpener: (opener, _line, lineNumber) => {
					if (opener === ENTRY_BLOCK_DELIMITER.opener) {
						throw new Error(`Parse error at line ${lineNumber}: entry blocks cannot be nested inside groups`);
					}
				},
			}),
			group,
		};
	}

	for (let i = 1; i < lines.length; ) {
		const trimmed = lines[i].trim();
		if (isProjectGapLine(trimmed)) {
			i += 1;
			continue;
		}
		const opener = getProjectOpenerKeyword(trimmed);
		if (!opener) throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);

		if (opener !== ENTRY_BLOCK_DELIMITER.opener) {
			if (opener === documentBlockInstructionByType.module.start) {
				throw new Error(`Parse error at line ${i + 1}: module blocks must be inside an entry block`);
			}
			if (opener === GROUP_BLOCK_DELIMITER.opener) {
				throw new Error(`Parse error at line ${i + 1}: group blocks must be inside an entry block`);
			}
			const parsed = readProjectBlock(i);
			addParsedBlock(project, parsed);
			i = parsed.nextIndex;
			continue;
		}

		const entryName = getProjectBlockName(trimmed, i + 1, 'entry');
		if (seenEntryNames.has(entryName)) {
			throw new Error(`Parse error at line ${i + 1}: duplicate entry "${entryName}"`);
		}
		seenEntryNames.add(entryName);
		i = readProjectContainerContents(i + 1, {
			project,
			entry: entryName,
			container: ENTRY_BLOCK_DELIMITER,
			validateDocumentOpener: (innerOpener, line, lineNumber) => {
				if (innerOpener !== documentBlockInstructionByType.module.start) {
					throw new Error(
						`Parse error at line ${lineNumber}: entry "${entryName}" can only contain module or group blocks, got "${line}"`
					);
				}
			},
		});
	}

	return project;
}
